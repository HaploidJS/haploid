import { createPseudoScriptElement } from '../../utils/PseudoElement';
import { AsyncSeriesBailHook } from '../../tapable/index';
import { createDocumentRootElement } from './utils';
import { NodeShadowImpl } from './NodeShadowImpl';
import { DocumentShadow } from './interfaces';

export class RawDocumentNode extends NodeShadowImpl<Document> implements DocumentShadow {
    readonly #window: Window;
    readonly #root: ReturnType<typeof createDocumentRootElement>;

    public readonly hooks = {
        scriptappended: new AsyncSeriesBailHook<HTMLScriptElement, void>(['script']),
        linkappended: new AsyncSeriesBailHook<HTMLLinkElement, void>(['link']),
    };

    constructor(window: Window) {
        super({});
        this.#window = window;
        this.#root = createDocumentRootElement(this.node, {});
    }

    protected get debugName(): string {
        return 'chrome:RawDocumentNode';
    }

    public get htmlElement(): HTMLElement {
        return this.#root.html;
    }

    public get bodyElement(): HTMLElement {
        return this.#root.body;
    }

    public get headElement(): HTMLElement {
        return this.#root.head;
    }

    public get titleElement(): HTMLElement {
        return this.#root.title;
    }

    public createPseudoScriptElement(): HTMLScriptElement {
        return createPseudoScriptElement();
    }

    public toggleVisibilityState(/* visibilityState: DocumentVisibilityState */): void {
        // Do nothing.
    }

    public onLoading(): void {}
    public onLoad(): void {}
    public onDestroy(): void {}

    public get node(): Document {
        return this.#window.document;
    }
}
