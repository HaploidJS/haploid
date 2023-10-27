import { getUniversalUmdExportResolver } from '../UmdExportResolver';
import { WindowNode, RawWindowNode, WindowShadow } from './BOM/';
import { ElementNode, ScriptNode, StyleNode } from '../node/';
import type { ChromeOptions, LifecycleFns, ResourceFetchingOptions } from '../Def';
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

export class Chrome extends Debugger {
    readonly #options: ChromeOptions;

    readonly #windowShadow: WindowShadow;
    readonly #esEngine: ESEngine;

    #isClosed = false;

    constructor(options: ChromeOptions) {
        super();
        this.#options = options;

        const sandbox = parseSandbox(options.sandbox);

        this.#windowShadow = sandbox
            ? new WindowNode(
                  options.name,
                  options.envVariables ?? {},
                  /* document options */
                  {
                      ...sandbox,
                      baseURI: options.baseURI,
                      lastModified: options.lastModified,
                  },
                  /* window options */
                  sandbox
              )
            : new RawWindowNode(options.envVariables ?? {});

        this.headElement.appendChild(PresetDOMParser.parseHeadElement(options.presetHeadHTML ?? ''));

        this.bodyElement.appendChild(
            PresetDOMParser.parseBodyElement(options.presetBodyHTML ?? options.domWrapper ?? '', options.baseURI)
        );

        if (options.title) {
            this.titleElement.textContent = options.title;
        }

        this.#esEngine = createESEngine(
            /* scoped */ Boolean(sandbox),
            /* windowShadow */ this.#windowShadow,
            /* esEngineOptions */ options
        );

        this.#windowShadow.documentShadow.hooks.scriptappended.tapPromise('Chrome', script => {
            const node = ScriptNode.fromElement(script, script.baseURI);

            return node.downloadContent(this.#createFetchResourceOptions(node.src)).then(
                () =>
                    promiseIgnoreCatch(Promise.resolve().then(() => this.#execScriptNode(node, script))).then(() => {}),
                error => Promise.reject(error)
            );
        });

        this.#windowShadow.documentShadow.hooks.linkappended.tapPromise('Chrome', link => {
            const node = StyleNode.fromLinkElement(link, link.baseURI);

            // Only care valid ones.
            if (!node.isValid) return Promise.resolve();
            // TODO support preload etc.

            return node.downloadContent(this.#createFetchResourceOptions(node.href)).then(
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
        });

        this.htmlElement.setAttribute(
            'data-haploid-app',
            'undefined' === typeof CSS ? options.name : CSS.escape(options.name)
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

    /**
     * This function is not concurrency-safe.
     *
     * @param content
     * @returns
     */
    public open<CustomProps>(content: ChromeContent): Promise<LifecycleFns<CustomProps>> {
        this.debug('Call open(%O).', content);
        if (this.#isClosed) {
            return Promise.reject(Error('This chrome has been closed.'));
        }

        this.#windowShadow.onLoading();

        return this.#loadWith(content).finally(() => {
            this.#windowShadow.onLoad();
        });
    }

    #createFetchResourceOptions(src?: string): ResourceFetchingOptions {
        const fetchResourceOptions = this.#options.fetchResourceOptions;
        let rfo: ResourceFetchingOptions;

        if ('function' === typeof fetchResourceOptions) {
            rfo = src ? fetchResourceOptions.call(null, src) : {};
        } else {
            rfo = fetchResourceOptions ?? {};
        }

        if (!('timeout' in rfo)) {
            rfo.timeout = 5000;
        } else if ('number' !== typeof rfo.timeout || rfo.timeout < 0) {
            rfo.timeout = 5000;
        }

        if (!('retries' in rfo)) {
            rfo.retries = 0;
        } else if ('number' !== typeof rfo.retries || rfo.retries < 0) {
            rfo.retries = 0;
        }

        return rfo;
    }

    async #loadWith<CustomProps>(content: ChromeContent): Promise<LifecycleFns<CustomProps>> {
        const { styles, depScripts, nonDepScripts, entry } = this.analyse(this.urlRewrite(content));

        // ⬇️ Downloading styles should block process.
        await Promise.all(styles.map(s => s.downloadContent(this.#createFetchResourceOptions(s.href))));
        // Downloading contents costs so much time, we have to check if this chrome has already exited.
        if (this.#isClosed) throw Error(`${this} has been closed.`);

        this.#createStyleElements(styles);

        this.debug('Download and evaluate dependency scripts: %O.', depScripts.join('\n'));

        let indexWaitToExecute = 0;

        const downloadedRecord = new Array<boolean>(depScripts.length).fill(false);

        await Promise.all([
            entry.downloadContent(this.#createFetchResourceOptions(entry.src)),
            ...depScripts.map((s, i) =>
                s
                    .downloadContent(this.#createFetchResourceOptions(s.src))
                    .then(() => {
                        downloadedRecord[i] = true;
                        if (i === indexWaitToExecute) {
                            let j = i;
                            while (j < downloadedRecord.length && downloadedRecord[j]) {
                                this.#execScriptNode(depScripts[j]);
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
            if (!nonDepScripts.length) {
                return;
            }

            this.debug('Evaluate non-dependency scripts:\n%s.', nonDepScripts.join('\n'));

            // ⬇️ Download non-dependency scripts.
            await Promise.all(nonDepScripts.map(s => s.downloadContent(this.#createFetchResourceOptions(s.src))));

            if (this.#isClosed) return;
            nonDepScripts.forEach(s => this.#execScriptNode(s));
        });

        this.debug('Evaluate entry script: %s.', entry);

        if (entry.isESM) {
            const exported = await this.#execScriptNode<
                LifecycleFns<CustomProps> | { __HAPLOID_LIFECYCLE_EXPORT__: Promise<LifecycleFns<CustomProps>> }
            >(entry);

            if ('__HAPLOID_LIFECYCLE_EXPORT__' in exported) {
                return Promise.resolve(exported.__HAPLOID_LIFECYCLE_EXPORT__);
            }

            return exported;
        }

        const entryKey = getUniversalUmdExportResolver().resolve(
            () => this.#execScriptNode(entry),
            entry.src || entry.content,
            this.window
        );

        return this.window[entryKey];
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

    async #createStyleElements(styles: StyleNode[]): Promise<void> {
        this.debug('Call #createStyleElements(%O).', styles);

        for (const style of styles) {
            const styleElement = this.#createInlineStyle(style);

            this.#windowShadow.documentShadow.headElement.appendChild(styleElement);
        }
    }

    public analyse(content: { scripts: ScriptNode[]; styles: StyleNode[] }): {
        styles: StyleNode[];
        depScripts: ScriptNode[];
        nonDepScripts: ScriptNode[];
        entry: ScriptNode;
    } {
        const invalid: ElementNode[] = [];
        const scripts: ScriptNode[] = [];
        const styles: StyleNode[] = [];
        const entries: ScriptNode[] = [];

        content.scripts.forEach(node => {
            (node.isValid ? scripts : invalid).push(node);
            if (node.isValid && node.isEntry) entries.push(node);
        });

        if (entries.length > 1) {
            this.debug('Unexpected redundant entries:\n%s.', entries.join('\n'));
            throw Error(`${this} has unexpected redundant entries.`);
        }

        let entry = entries[0];

        if (!entry) {
            for (let i = scripts.length - 1; i >= 0; i -= 1) {
                if ('undefined' === typeof scripts[i].isEntry) {
                    entry = scripts[i];
                    break;
                }
            }
        }

        if (!entry) throw Error(`${this} has no js entry.`);

        content.styles.forEach(node => (node.isValid ? styles : invalid).push(node));

        if (this.debug.enabled && invalid.length > 0) {
            this.debug('Invalid style or script:\n%s.', invalid.join('\n'));
        }

        let entryIndex = -1;
        const depScripts: ScriptNode[] = [];
        const nonDepScripts: ScriptNode[] = [];

        scripts.forEach((s, index) => {
            if (s === entry) {
                entryIndex = index;
                return;
            }

            let isDep = false;

            if (entry.isAsync) {
                isDep = entryIndex === -1 && !s.isAsync && !s.isDefer;
            } else if (entry.isDefer) {
                isDep = (entryIndex === -1 && !s.isAsync) || (entryIndex > -1 && !s.isAsync && !s.isDefer);
            } else {
                isDep = entryIndex === -1 && !s.isAsync && !s.isDefer;
            }

            (isDep ? depScripts : nonDepScripts).push(s);
        });

        if (this.debug.enabled) {
            this.debug('Styles and dependency scripts:\n%s.', [...styles, ...depScripts, entry].join('\n'));
        }

        return {
            styles,
            depScripts,
            nonDepScripts,
            entry,
        };
    }

    public urlRewrite(content: ChromeContent): ChromeContent {
        if (!this.#options.urlRewrite) {
            return content;
        }

        if ('function' !== typeof this.#options.urlRewrite) {
            console.warn('Option "urlRewrite" must be a function.');
            return content;
        }

        const rewritedScripts: ScriptNode[] = [];
        const rewritedStyles: StyleNode[] = [];

        for (const script of content.scripts) {
            if (script.src) {
                const newUrl = this.#options.urlRewrite.call(null, script.src);
                if ('string' !== typeof newUrl) {
                    console.warn(`Option urlRewrite must return a string`);
                    rewritedScripts.push(script);
                    continue;
                }

                this.debug('Rewrite %s to %s.', script.src, newUrl);

                rewritedScripts.push(
                    script.clone({
                        src: newUrl,
                    })
                );
            } else {
                rewritedScripts.push(script);
            }
        }

        for (const style of content.styles) {
            if (style.href) {
                const newUrl = this.#options.urlRewrite.call(null, style.href);
                if ('string' !== typeof newUrl) {
                    console.warn(`Option urlRewrite must return a string`);
                    rewritedStyles.push(style);
                    continue;
                }

                this.debug('Rewrite %s to %s.', style.href, newUrl);

                rewritedStyles.push(
                    style.clone({
                        href: newUrl,
                    })
                );
            } else {
                rewritedStyles.push(style);
            }
        }

        return {
            scripts: rewritedScripts,
            styles: rewritedStyles,
        };
    }

    #execScriptNode<T = unknown>(script: ScriptNode, scriptElement?: HTMLScriptElement): Promise<T> | T {
        if (script.isESM) {
            return this.#execESMWithCurrentScript(script, scriptElement);
        } else {
            return this.#execNonESMWithCurrentScript<T>(script, scriptElement);
        }
    }

    #execESMWithCurrentScript<T>(script: ScriptNode, scriptElement?: HTMLScriptElement): Promise<T> {
        // TODO ESM should specify import.meta.url.
        if (!scriptElement) this.#insertPseudoScript(script);
        return this.#esEngine.execESMScript(script.content, script.src);
    }

    /**
     * Evaluate a non-ESM script, with surrounding of corrent document.currentScript.
     * @param script
     * @param scriptElement The surrounding <script>, created if not provided.
     * @returns
     */
    #execNonESMWithCurrentScript<T = unknown>(script: ScriptNode, scriptElement?: HTMLScriptElement): T {
        scriptElement = scriptElement ?? this.#insertPseudoScript(script);

        Reflect.defineProperty(this.window.document, 'currentScript', {
            get() {
                return scriptElement;
            },
            configurable: true,
            enumerable: true,
        });

        try {
            return this.#esEngine.execScript<T>(script.content, script.src);
        } finally {
            Reflect.defineProperty(this.window.document, 'currentScript', {
                get() {
                    return null;
                },
                configurable: true,
                enumerable: true,
            });
        }
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

    public close(): void {
        this.#esEngine.onDestroy();
        this.#windowShadow.onDestroy();
        this.#isClosed = true;
    }
}
