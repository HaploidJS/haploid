import { ElementNode, ElementNodeProps } from './ElementNode';
import { getUniversalDownloader } from '../Downloader';
import { toAbsolutePath } from '../utils/url';
import type { CrossOrigin, ResourceFetchingOptions } from '../Def';

export interface StyleNodeInitProps extends ElementNodeProps {
    disabled?: boolean;
    media?: string;
    href?: string;
    content?: string;
    rel?: string;
    type?: string;
    crossOrigin?: CrossOrigin;
}

export class StyleNode extends ElementNode<StyleNodeInitProps> {
    constructor(props: Omit<StyleNodeInitProps, keyof ElementNodeProps> & Partial<ElementNodeProps>) {
        super({ ...props, owner: props.owner || location.href });
    }

    public static fromLinkElement(linkElement: HTMLLinkElement, baseUrl: string): StyleNode {
        return new StyleNode({
            owner: baseUrl,
            href: toAbsolutePath(linkElement.getAttribute('href') ?? undefined, baseUrl),
            type: linkElement.type,
            disabled: linkElement.disabled,
            rel: linkElement.rel,
            media: linkElement.media,
            crossOrigin: linkElement.crossOrigin as CrossOrigin,
        });
    }

    public static fromStyleElement(stylelement: HTMLStyleElement, baseUrl: string): StyleNode {
        return new StyleNode({
            owner: baseUrl,
            type: stylelement.getAttribute('type') ?? undefined,
            media: stylelement.media,
            content: stylelement.innerHTML,
        });
    }

    public override get [Symbol.toStringTag](): string {
        return 'StyleNode';
    }

    public get isInline(): boolean {
        return !this.href;
    }

    public get disabled(): boolean {
        return this.props.disabled ?? false;
    }

    public get crossOrigin(): CrossOrigin {
        return this.props.crossOrigin;
    }

    public get href(): string | undefined {
        return this.props.href?.trim();
    }

    public get rel(): string | undefined {
        return this.props.rel?.trim();
    }

    public get type(): string | undefined {
        return this.props.type?.trim();
    }

    public get media(): string | undefined {
        return this.props.media;
    }

    public override get content(): string {
        return this.props.content?.trim() || '';
    }

    /**
     * This function is not concurrency-safe.
     * @param options RequestInit
     * @returns Promise<string>
     */
    public downloadContent(options?: ResourceFetchingOptions): Promise<string> {
        if (!this.href) {
            return Promise.resolve(this.content);
        }

        const req: RequestInit = {
            ...options,
        };

        if (this.crossOrigin === 'use-credentials') {
            req.credentials = 'include';
        }

        return getUniversalDownloader()
            .download(this.href, req, options?.timeout, options?.retries)
            .then(text => {
                this.props.content = text;
                return text;
            });
    }

    public override get isValid(): boolean {
        if (this.props.disabled) {
            return false;
        }

        if (!['', undefined, 'stylesheet'].includes(this.rel)) {
            return false;
        }

        if (!this.href && !this.content) {
            return false;
        }

        if (!['', undefined, 'text/css'].includes(this.type)) {
            return false;
        }

        return true;
    }

    public override toString(): string {
        if (this.isInline) {
            return `<${['style', this.type ? `type=${this.type}` : ''].filter(Boolean).join(' ')}>${
                this.content.length > 50 ? `${this.content.slice(0, 50)}...` : this.content
            }</style>`;
        }
        return `<${[
            'link',
            this.href ? `href="${this.href}"` : '',
            this.type ? `type=${this.type}` : '',
            this.media ? `media=${this.media}` : '',
            this.rel ? `rel="${this.rel}"` : '',
            this.disabled ? `disabled` : '',
            this.crossOrigin ? `crossorigin="${this.crossOrigin}"` : '',
        ]
            .filter(Boolean)
            .join(' ')}></link>`;
    }
}
