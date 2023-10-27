import { EventEmitter } from 'eventemitter3';

import { HAPLOID_DEV_TOOL_VERSION, __HAPLOID_DEV_TOOL__ } from './constant';
import type { Container } from './Container';

import { ProtectedEventEmitter } from './utils/ProtectedEventEmitter';
import { createUniversalFactory } from './utils/createUniversalFactory';
import { Debugger } from './utils/Debugger';

export type DevToolEvent = {
    containercreated: { container: Container<unknown, unknown> };
    containerremoved: { container: Container<unknown, unknown> };
};

export type ContainerStore = {
    createTime: number;
    container: Container<unknown, unknown>;
};

class DevTool extends Debugger implements ProtectedEventEmitter<DevToolEvent> {
    static #instance: DevTool;

    readonly #containers: Set<ContainerStore> = new Set();

    readonly #eventBus = new EventEmitter<keyof DevToolEvent>();

    public get version(): number {
        return HAPLOID_DEV_TOOL_VERSION;
    }

    protected get debugName(): string {
        return 'devtool';
    }

    public get [Symbol.toStringTag](): string {
        return 'DevTool';
    }

    private constructor() {
        super();
        /* istanbul ignore if: difficult to enter */
        if (DevTool.#instance) {
            throw Error('DevTool cannot be created more than once.');
        }
    }

    public on<T extends keyof DevToolEvent>(
        event: T,
        listener: (event: DevToolEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.on(event, listener, context);
        return this;
    }

    public once<T extends keyof DevToolEvent>(
        event: T,
        listener: (event: DevToolEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.once(event, listener, context);
        return this;
    }

    public off<T extends keyof DevToolEvent>(
        event: T,
        listener: (event: DevToolEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.off(event, listener, context);
        return this;
    }

    public get containers(): Set<ContainerStore> {
        return this.#containers;
    }

    #emit<T extends keyof DevToolEvent>(event: T, payload: DevToolEvent[T]): void {
        this.debug('Emit %s with %O.', event, payload);
        // Should not break down.
        try {
            this.#eventBus.emit(event, payload);
        } catch {
            //
        }
    }

    public notifyContainerCreated(container: Container<unknown, unknown>): void {
        this.debug('Call notifyContainerCreated(%O) destroyed.', container);

        const store = {
            container,
            createTime: Date.now(),
        };

        container.once('destroyed', () => {
            this.debug('Captured container %O destroyed.', container);
            this.#containers.delete(store);
            this.#emit('containerremoved', { container });
        });

        this.#containers.add(store);
        this.#emit('containercreated', { container });
    }

    public static getInstance(): DevTool {
        if (!DevTool.#instance) {
            DevTool.#instance = new DevTool();
        }

        return DevTool.#instance;
    }
}

export type { DevTool };

export const getUniversalDevTool = createUniversalFactory<DevTool>(
    __HAPLOID_DEV_TOOL__,
    () => DevTool.getInstance(),
    HAPLOID_DEV_TOOL_VERSION,
    // Conflict is better than throwing error.
    true
);
