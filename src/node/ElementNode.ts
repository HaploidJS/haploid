export interface ElementNodeProps {
    owner: string;
}

export abstract class ElementNode<T extends ElementNodeProps = ElementNodeProps> {
    readonly #props: T;

    static DEFAULT_TIMEOUT = 5e3;
    static DEFAULT_RETRIES = 0;

    constructor(props: T) {
        this.#props = props;
    }

    public get props(): T {
        return this.#props;
    }

    public get owner(): string {
        return this.#props.owner;
    }

    public clone(overrideProps?: Partial<T>): this {
        return Reflect.construct(this.constructor, [
            {
                ...this.#props,
                ...overrideProps,
            },
        ]);
    }

    public abstract get isValid(): boolean;
    public abstract get content(): string;
    public abstract get [Symbol.toStringTag](): string;
    public abstract downloadContent(options?: RequestInit): Promise<string>;
    public abstract toString(): string;
}
