import { ElementNode, ElementNodeProps } from './ElementNode';
import { getUniversalDownloader } from '../Downloader';
import { toAbsolutePath } from '../utils/url';
import type { CrossOrigin, ResourceFetchingOptions } from '../Def';

export interface ScriptNodeInitProps extends ElementNodeProps {
    src?: string;
    content?: string;
    async?: boolean;
    defer?: boolean;
    type?: string;
    crossOrigin?: CrossOrigin;
    entry?: boolean;
    noModule?: boolean;
}

export class ScriptNode extends ElementNode<ScriptNodeInitProps> {
    constructor(props: Omit<ScriptNodeInitProps, keyof ElementNodeProps> & Partial<ElementNodeProps>) {
        super({ ...props, owner: props.owner || location.href });
    }

    public static fromElement(scriptElement: HTMLScriptElement, baseUrl: string): ScriptNode {
        return new ScriptNode({
            owner: baseUrl,
            src: scriptElement.hasAttribute('src')
                ? toAbsolutePath(scriptElement.getAttribute('src') || undefined, baseUrl)
                : undefined,
            content: scriptElement.text,
            // HTMLScriptElement.async is always true in new created document.
            async: scriptElement.hasAttribute('async'),
            defer: scriptElement.hasAttribute('defer'),
            type: scriptElement.type,
            entry: scriptElement.hasAttribute('entry') ? true : undefined,
            crossOrigin: scriptElement.crossOrigin as CrossOrigin,
            noModule: scriptElement.noModule ?? scriptElement.hasAttribute('nomodule'),
        });
    }

    public override get [Symbol.toStringTag](): string {
        return 'ScriptNode';
    }

    public get isESM(): boolean {
        return this.type === 'module';
    }

    public set isESM(esm: boolean) {
        this.props.type = esm ? 'module' : 'text/javascript';
    }

    public get crossOrigin(): CrossOrigin {
        return this.props.crossOrigin;
    }

    public get isInline(): boolean {
        return !this.src;
    }

    public get isEntry(): boolean | undefined {
        return this.props.entry;
    }

    public get isAsync(): boolean {
        return this.props.async === true;
    }

    public get isDefer(): boolean {
        // "defer" works only for external scripts, or ESM.
        return (this.props.defer === true && undefined !== this.src) || this.isESM;
    }

    public get src(): string | undefined {
        return this.props.src?.trim();
    }

    public override get content(): string {
        return this.props.content?.trim() || '';
    }

    public get type(): string | undefined {
        return this.props.type?.trim();
    }

    public downloadContent(options?: ResourceFetchingOptions): Promise<string> {
        if (!this.src) {
            return Promise.resolve(this.content);
        }

        // Do not download if ESM: we do not support invoke ESM source code.
        if (this.isESM) {
            return Promise.resolve(this.content);
        }

        const req: RequestInit = {
            ...options,
        };

        if (this.crossOrigin === 'use-credentials') {
            req.credentials = 'include';
        }

        return getUniversalDownloader()
            .download(this.src, req, options?.timeout, options?.retries)
            .then(text => {
                this.props.content = text;
                return text;
            });
    }

    public override get isValid(): boolean {
        if (this.props.noModule) {
            // We always enable ES module.
            return false;
        }

        if (!this.src && !this.content) {
            return false;
        }

        if (!['', undefined, 'module', 'text/javascript'].includes(this.type)) {
            return false;
        }

        return true;
    }

    public override toString(): string {
        return `<${[
            'script',
            this.src ? `src="${this.src}"` : '',
            this.isAsync ? 'async' : '',
            this.isEntry ? 'entry' : '',
            this.props.defer ? 'defer' : '',
            this.type ? `type="${this.type}"` : '',
            this.crossOrigin ? `crossorigin="${this.crossOrigin}"` : '',
        ]
            .filter(Boolean)
            .join(' ')}>${this.content.length > 50 ? `${this.content.slice(0, 50)}...` : this.content}</script>`;
    }
}
