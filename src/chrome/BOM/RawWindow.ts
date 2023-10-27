import { DocumentShadow, WindowShadow } from './interfaces';
import { RawDocumentNode } from './RawDocument';
import { NodeShadowImpl } from './NodeShadowImpl';
import { nativeWindow } from '../utils';

export class RawWindowNode extends NodeShadowImpl<Window> implements WindowShadow {
    readonly #doc: DocumentShadow;
    constructor(shadow: Record<PropertyKey, unknown>) {
        super(shadow);
        this.#doc = new RawDocumentNode(this.node);
    }

    protected get debugName(): string {
        return 'chrome:RawWindowNode';
    }

    public get documentShadow(): DocumentShadow {
        return this.#doc;
    }

    public onLoading(): void {
        this.#doc.onLoading();
    }

    public onLoad(): void {
        this.#doc.onLoad();
    }

    public onDestroy(): void {
        this.#doc.onDestroy();
    }

    public get node(): Window {
        return nativeWindow;
    }
}
