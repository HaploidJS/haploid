import { Debugger } from '../../utils/Debugger';
import type { NodeShadow } from './interfaces';

export abstract class NodeShadowImpl<T> extends Debugger implements NodeShadow<T> {
    readonly #shadow: Record<PropertyKey, unknown>;

    constructor(shadow: Record<PropertyKey, unknown>) {
        super();
        this.#shadow = shadow;
    }

    public abstract get node(): T;

    public get shadow(): Readonly<Record<PropertyKey, unknown>> {
        return this.#shadow;
    }

    public abstract onDestroy(): void;
    public abstract onLoad(): void;
    public abstract onLoading(): void;
}
