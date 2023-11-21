import { getUniversalGlobalExportResolver } from '../GlobalExportResolver';
import { analyse, urlRewrite, createFetchResourceOptions } from './utils';
import { WindowNode, RawWindowNode, WindowShadow } from './BOM/';
import { ScriptNode, StyleNode } from '../node/';
import { ChromeOptions, LifecycleFns } from '../Def';
import { createESEngine, ESEngine } from './ESEngine';

import { PresetDOMParser } from '../utils/PresetDOMParser';
import { promiseIgnoreCatch } from '../utils/promiseIgnoreCatch';
import { parseSandbox } from '../utils/parseSandbox';
import { Debugger } from '../utils/Debugger';
import { fixCssUrl } from '../utils/css';

interface ChromeContent {
    scripts: ScriptNode[];
    styles: StyleNode[];
}

export class Chrome<T = unknown> extends Debugger {
    readonly #options: ChromeOptions;

    readonly #windowShadow: WindowShadow;
    readonly #esEngine: ESEngine;
    readonly #evalEnv: Record<PropertyKey, unknown> & { module: { exports: unknown } };

    readonly #originalExports = {};

    #lifecycleFns: LifecycleFns<T> | undefined = undefined;

    #isClosed = false;

    constructor(options: ChromeOptions) {
        super();
        this.#options = options;

        const sandbox = parseSandbox(options.sandbox);

        const exports = this.#originalExports;
        const module = { exports };

        const require = (key: string): void => {
            this.debug('Call require(%s).', key);
        };

        const env = (this.#evalEnv = {
            ...options.envVariables,
            module,
            exports,
            require,
        });

        this.#windowShadow = sandbox
            ? new WindowNode(
                  options.name,
                  env,
                  /* document options */
                  {
                      ...sandbox,
                      baseURI: options.baseURI,
                      lastModified: options.lastModified,
                  },
                  /* window options */
                  sandbox
              )
            : new RawWindowNode(env);

        this.headElement.appendChild(PresetDOMParser.parseHeadElement(options.presetHeadHTML ?? ''));

        this.bodyElement.appendChild(PresetDOMParser.parseBodyElement(options.presetBodyHTML ?? '', options.baseURI));

        if (options.title) {
            this.titleElement.textContent = options.title;
        }

        this.#esEngine = createESEngine(
            /* scoped */ Boolean(sandbox),
            /* windowShadow */ this.#windowShadow,
            /* esEngineOptions */ options
        );

        this.#windowShadow.documentShadow.hooks.scriptappended.tapPromise('Chrome', script =>
            this.onNewScriptElementCreated(script)
        );

        this.#windowShadow.documentShadow.hooks.linkappended.tapPromise('Chrome', link =>
            this.onNewLinkElementCreated(link)
        );

        this.htmlElement.setAttribute(
            'data-haploid-app',
            'undefined' === typeof CSS ? options.name : CSS.escape(options.name)
        );
    }

    public onNewLinkElementCreated(link: HTMLLinkElement): Promise<void> {
        const node = StyleNode.fromLinkElement(link, link.baseURI);

        // Only care valid ones.
        if (!node.isValid) return Promise.resolve();
        // TODO support preload etc.

        return node.downloadContent(createFetchResourceOptions(node.href, this.#options.fetchResourceOptions)).then(
            () =>
                promiseIgnoreCatch(
                    Promise.resolve().then(() => {
                        const styleElement = this.#createInlineStyle(node);
                        // Put the inline <style> after <haploid-link>
                        link.insertAdjacentElement('afterend', styleElement);
                    })
                ).then(() => {}),
            error => Promise.reject(error)
        );
    }

    public onNewScriptElementCreated(script: HTMLScriptElement): Promise<void> {
        const node = ScriptNode.fromElement(script, script.baseURI);

        return node.downloadContent(createFetchResourceOptions(node.src, this.#options.fetchResourceOptions)).then(
            () => promiseIgnoreCatch(Promise.resolve().then(() => this.#execScriptNode(node, script))).then(() => {}),
            error => Promise.reject(error)
        );
    }

    protected get debugName(): string {
        return `chrome:${this.#options.name}`;
    }

    public get [Symbol.toStringTag](): string {
        return 'Chrome';
    }

    public override toString(): string {
        return `${this[Symbol.toStringTag]}(${this.#options.name})`;
    }

    public get htmlElement(): HTMLElement {
        return this.#windowShadow.documentShadow.htmlElement;
    }

    public get headElement(): HTMLElement {
        return this.#windowShadow.documentShadow.headElement;
    }

    public get titleElement(): HTMLElement {
        return this.#windowShadow.documentShadow.titleElement;
    }

    public get bodyElement(): HTMLElement {
        return this.#windowShadow.documentShadow.bodyElement;
    }

    public get window(): Window {
        return this.#windowShadow.node;
    }

    public get lifecycleFns(): LifecycleFns<T> | undefined {
        return this.#lifecycleFns;
    }

    #entry: ScriptNode | null = null;
    #styles: StyleNode[] = [];
    #depScripts: ScriptNode[] = [];
    #nonDepScripts: ScriptNode[] = [];

    public get entry(): ScriptNode | null {
        return this.#entry;
    }

    public get styles(): StyleNode[] {
        return this.#styles;
    }

    public get depScripts(): ScriptNode[] {
        return this.#depScripts;
    }

    public get nonDepScripts(): ScriptNode[] {
        return this.#nonDepScripts;
    }

    /**
     * This function is not concurrency-safe.
     *
     * @param content
     * @returns
     */
    public async launch(content: ChromeContent): Promise<void> {
        this.debug('Call open(%O).', content);

        if (this.#isClosed) {
            return Promise.reject(Error('This chrome has been closed.'));
        }

        this.#windowShadow.onLoading();

        try {
            const { styles, depScripts, nonDepScripts, entry } = analyse(urlRewrite(content, this.#options.urlRewrite));

            this.#styles = styles;
            this.#depScripts = depScripts;
            this.#nonDepScripts = nonDepScripts;
            this.#entry = entry;

            await this.load();
        } finally {
            this.#windowShadow.onLoad();
        }
    }

    public async load(): Promise<void> {
        // ⬇️ Downloading styles should block process.
        await Promise.all(
            this.#styles.map(s =>
                s.downloadContent(createFetchResourceOptions(s.href, this.#options.fetchResourceOptions))
            )
        );
        // Downloading contents costs so much time, we have to check if this chrome has already exited.
        if (this.#isClosed) throw Error(`${this} has been closed.`);

        this.#createStyleElements(this.#styles);

        this.debug('Download and evaluate dependency scripts: %O.', this.#depScripts.join('\n'));

        let indexWaitToExecute = 0;

        const downloadedRecord = new Array<boolean>(this.#depScripts.length).fill(false);

        await Promise.all([
            this.#entry?.downloadContent(
                createFetchResourceOptions(this.#entry.src, this.#options.fetchResourceOptions)
            ),
            ...this.#depScripts.map((s, i) =>
                s
                    .downloadContent(createFetchResourceOptions(s.src, this.#options.fetchResourceOptions))
                    .then(() => {
                        downloadedRecord[i] = true;
                        if (i === indexWaitToExecute) {
                            let j = i;
                            while (j < downloadedRecord.length && downloadedRecord[j]) {
                                this.#execScriptNode(this.#depScripts[j]);
                                j += 1;
                            }
                            indexWaitToExecute = j;
                        }
                    })
                    .finally(() => {
                        if (this.#isClosed) throw Error(`${this} has been closed.`);
                    })
            ),
        ]);

        // Evaluate non-dependency scripts, don't block process.
        setTimeout(async () => {
            if (!this.#nonDepScripts.length) {
                return;
            }

            this.debug('Evaluate non-dependency scripts:\n%s.', this.#nonDepScripts.join('\n'));

            // ⬇️ Download non-dependency scripts.
            await Promise.all(
                this.#nonDepScripts.map(s =>
                    s.downloadContent(createFetchResourceOptions(s.src, this.#options.fetchResourceOptions))
                )
            );

            if (this.#isClosed) return;
            this.#nonDepScripts.forEach(s => this.#execScriptNode(s));
        });

        if (this.#entry) this.#lifecycleFns = await this.executeEntryAndGetLifecycle(this.#entry);
    }

    public executeEntryAndGetLifecycle<T>(entry: ScriptNode): Promise<LifecycleFns<T> | undefined> {
        const jsType = this.#options.jsExportType;

        this.debug('Evaluate entry script %s by type %s.', entry, jsType);

        switch (jsType) {
            case undefined:
                return entry.isESM
                    ? this.#executeEntryAndGetLifecycleByESM(entry)
                    : this.#executeEntryAndGetLifecycleByUMD(entry);
            case 'esm':
            case 'module':
                entry.isESM = true;
                return this.#executeEntryAndGetLifecycleByESM(entry);
            case 'umd':
                entry.isESM = false;
                return this.#executeEntryAndGetLifecycleByUMD(entry);
            case 'global':
                entry.isESM = false;
                return this.#executeEntryAndGetLifecycleByGlobal(entry);
            default:
        }

        return Promise.resolve(undefined);
    }

    #executeEntryAndGetLifecycleByGlobal<T>(entry: ScriptNode): Promise<LifecycleFns<T>> {
        const entryKey = getUniversalGlobalExportResolver().resolve(
            () => this.#execScriptNode(entry),
            entry.src || entry.content,
            this.window
        );

        return this.window[entryKey];
    }

    #executeEntryAndGetLifecycleByUMD<T>(entry: ScriptNode): Promise<LifecycleFns<T>> {
        this.#execScriptNode(entry);
        // TODO check retry
        if (this.#evalEnv.module.exports !== this.#originalExports) {
            // exports has been set!
            return Promise.resolve(this.#evalEnv.module.exports as LifecycleFns<T>);
        }

        throw Error(`Cannot find UMD exports from ${entry.src}.`);
    }

    async #executeEntryAndGetLifecycleByESM<T>(entry: ScriptNode): Promise<LifecycleFns<T>> {
        const exported = await this.#execScriptNode<
            LifecycleFns<T> | { __HAPLOID_LIFECYCLE_EXPORT__: Promise<LifecycleFns<T>> }
        >(entry);

        if (exported && '__HAPLOID_LIFECYCLE_EXPORT__' in exported) {
            return Promise.resolve(exported.__HAPLOID_LIFECYCLE_EXPORT__);
        }

        return exported as LifecycleFns<T>;
    }

    #createInlineStyle(style: StyleNode): HTMLStyleElement {
        const styleElement = document.createElement('style');
        styleElement.setAttribute('type', 'text/css');

        let comment = '';

        if (style.href) {
            comment += `\n/* ${style.href} */\n`;
        } else {
            comment += '\n';
        }

        const text = document.createTextNode(
            `${
                comment + fixCssUrl(style.content, style.href || style.owner, this.#options.dropURLFixInCSSByStyleSheet)
            }\n`
        );
        styleElement.appendChild(text);

        if (style.media) {
            styleElement.media = style.media;
        }
        return styleElement;
    }

    #execScriptNode<T = unknown>(script: ScriptNode, scriptElement?: HTMLScriptElement): Promise<T> | void {
        this.debug(`Call #execScriptNode(%o).`, script);
        return this.#esEngine.execScript(
            script,
            () => {
                if (!scriptElement) scriptElement = this.#insertPseudoScript(script);

                if (!script.isESM) {
                    Reflect.defineProperty(this.window.document, 'currentScript', {
                        get() {
                            return scriptElement;
                        },
                        configurable: true,
                        enumerable: true,
                    });
                }
            },
            () => {
                if (!script.isESM) {
                    Reflect.defineProperty(this.window.document, 'currentScript', {
                        get() {
                            return null;
                        },
                        configurable: true,
                        enumerable: true,
                    });
                }
            }
        );
    }

    /**
     * Insert a pseudo <script> to be document.currentScript.
     * @param scriptNode
     * @returns The created pseudo <script>.
     */
    #insertPseudoScript(scriptNode: ScriptNode): HTMLScriptElement {
        const script: HTMLScriptElement = this.#windowShadow.documentShadow.createPseudoScriptElement();

        const { src, content, async, defer, type, crossOrigin, entry, noModule } = scriptNode.props;

        if (typeof src !== 'undefined') script.src = src;
        if (content) script.text = content;
        if (type) script.type = type;
        if (crossOrigin) script.crossOrigin = crossOrigin;
        if (entry) script.setAttribute('entry', '');

        Object.assign(script, {
            async,
            defer,
            noModule,
        });

        this.bodyElement.appendChild(script);

        return script;
    }

    async #createStyleElements(styles: StyleNode[]): Promise<void> {
        this.debug('Call #createStyleElements(%O).', styles);

        for (const style of styles) {
            const styleElement = this.#createInlineStyle(style);

            this.#windowShadow.documentShadow.headElement.appendChild(styleElement);
        }
    }

    public close(): void {
        this.#esEngine.onDestroy();
        this.#windowShadow.onDestroy();
        this.#isClosed = true;
    }
}
