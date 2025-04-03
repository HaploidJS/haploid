import EventEmitter from 'eventemitter3';

import { LifecycleFns, LifecycleFn, LifecycleOptions, FixedLifecycleProps } from './Def';
import { AsyncSeriesBailHook, AsyncSeriesHook } from './tapable/index';
import type { AppError } from './AppError';

import { ProtectedEventEmitter } from './utils/ProtectedEventEmitter';
import { validateLifecycleFn } from './utils/validateLifecycleFn';
import { promiseIgnoreCatch } from './utils/promiseIgnoreCatch';
import { asyncSequence } from './utils/asyncSequence';
import { Debugger } from './utils/Debugger';
import { toArray } from './utils/toArray';

export interface LifecycleHistory {
    name: string;
    status: 'pending' | 'success' | 'failed';
}

export interface LifecycleEvent {
    beforebootstrap: void;
    afterbootstrap: void;
    bootstraperror: AppError;

    beforemount: void;
    aftermount: void;
    mounterror: AppError;

    beforeunmount: void;
    afterunmount: void;
    unmounterror: AppError;

    beforeupdate: void;
    afterupdate: void;
    updateerror: AppError;
}

export type LifecycleHooks<CustomProps> = {
    beforebootstrap: AsyncSeriesHook<void>;
    afterbootstrap: AsyncSeriesHook<void>;
    bootstraperror: AsyncSeriesHook<AppError>;

    beforemount: AsyncSeriesHook<void>;
    aftermount: AsyncSeriesHook<void>;
    mounterror: AsyncSeriesHook<AppError>;

    beforeunmount: AsyncSeriesHook<void>;
    afterunmount: AsyncSeriesHook<void>;
    unmounterror: AsyncSeriesHook<AppError>;

    beforeupdate: AsyncSeriesHook<{ props: CustomProps }>;
    afterupdate: AsyncSeriesHook<{ props: CustomProps }>;
    updateerror: AsyncSeriesHook<AppError & { props: CustomProps }>;

    bootstrap: AsyncSeriesBailHook<void, unknown>;
    mount: AsyncSeriesBailHook<void, unknown>;
    unmount: AsyncSeriesBailHook<void, unknown>;
    update: AsyncSeriesBailHook<{ props: CustomProps }, unknown>;
};

function createLifecycleHooks<T>(): LifecycleHooks<T> {
    return Object.freeze({
        beforebootstrap: new AsyncSeriesHook<void>(),
        afterbootstrap: new AsyncSeriesHook<void>(),
        bootstraperror: new AsyncSeriesHook<AppError>(['error'], 'bootstraperror'),

        beforemount: new AsyncSeriesHook<void>(),
        aftermount: new AsyncSeriesHook<void>(),
        mounterror: new AsyncSeriesHook<AppError>(['error'], 'mounterror'),

        beforeunmount: new AsyncSeriesHook<void>(),
        afterunmount: new AsyncSeriesHook<void>(),
        unmounterror: new AsyncSeriesHook<AppError>(['error'], 'unmounterror'),

        beforeupdate: new AsyncSeriesHook<{ props: T }>(['params'], 'beforeupdate'),
        afterupdate: new AsyncSeriesHook<{ props: T }>(['params'], 'afterupdate'),
        updateerror: new AsyncSeriesHook<AppError & { props: T }>(['error'], 'updateerror'),

        bootstrap: new AsyncSeriesBailHook<void, unknown>(),
        mount: new AsyncSeriesBailHook<void, unknown>(),
        unmount: new AsyncSeriesBailHook<void, unknown>(),
        update: new AsyncSeriesBailHook<{ props: T }, unknown>(['params'], 'update'),
    });
}

export interface LifecycleAPI<CustomProps> {
    hooks: LifecycleHooks<CustomProps>;
    get customProps(): CustomProps;
    get history(): LifecycleHistory[];
    readonly fns: {
        call: (
            fnName: keyof LifecycleFns<CustomProps>,
            arg: CustomProps,
            allowUndefined?: boolean,
            each?: (index: number, total: number) => void
        ) => ReturnType<LifecycleFn<CustomProps>>;
        get raw(): LifecycleFns<CustomProps> | null;
    };
    readonly on: <T extends keyof LifecycleEvent>(
        event: T,
        listener: (event: LifecycleEvent[T]) => unknown,
        context?: unknown
    ) => this;
    readonly once: <T extends keyof LifecycleEvent>(
        event: T,
        listener: (event: LifecycleEvent[T]) => unknown,
        context?: unknown
    ) => this;
    readonly off: <T extends keyof LifecycleEvent>(
        event: T,
        listener: (event: LifecycleEvent[T]) => unknown,
        context?: unknown
    ) => this;
}

export class Lifecycle<CustomProps> extends Debugger implements ProtectedEventEmitter<LifecycleEvent> {
    readonly #eventBus = new EventEmitter<keyof LifecycleEvent>();
    #fns: LifecycleFns<CustomProps> | null = null;
    readonly #options: LifecycleOptions<CustomProps>;

    #apiInstance: LifecycleAPI<CustomProps> | null = null;

    readonly #fixedProps: FixedLifecycleProps;

    readonly #history: LifecycleHistory[] = [];

    declare public readonly hooks: LifecycleHooks<CustomProps>;

    constructor(options: LifecycleOptions<CustomProps>) {
        super();
        this.#options = options;
        this.#fixedProps = {
            name: options.name,
        };

        Object.defineProperty(this, 'hooks', {
            value: createLifecycleHooks<CustomProps>(),
            enumerable: false,
            writable: false,
            configurable: false,
        });

        for (const key of Object.keys(this.hooks) as Array<keyof LifecycleEvent>) {
            if (/(^before|^after|error$)/.test(key))
                this.hooks[key].tap(`${this}`, arg => {
                    this.#emit<typeof key>(key, arg as LifecycleEvent[typeof key]);
                });
        }
    }

    protected get debugName(): string {
        return `lifecycle:${this.name}`;
    }

    public get customProps(): CustomProps {
        const cp = this.#options.customProps ?? ({} as CustomProps);

        if ('function' === typeof cp) {
            return (cp as (name: string, loc: Location) => CustomProps).call(null, this.name, window.location);
        }

        return cp;
    }

    public get options(): LifecycleOptions<CustomProps> {
        return this.#options;
    }

    public get name(): string {
        return this.#options.name;
    }

    public get [Symbol.toStringTag](): string {
        return 'Lifecycle';
    }

    public override toString(): string {
        return `${this[Symbol.toStringTag]}(${this.name})`;
    }

    public setFns(fns: LifecycleFns<CustomProps>): void {
        validateLifecycleFn(fns);
        this.#fns = fns;
    }

    public get fns(): LifecycleFns<CustomProps> | null {
        return this.#fns;
    }

    public updateFixedProps(fixedProps: Omit<FixedLifecycleProps, 'name'>): void {
        Object.assign(this.#fixedProps, fixedProps);
    }

    #emit<T extends keyof LifecycleEvent>(event: T, payload: LifecycleEvent[T]): this {
        this.debug('Emit %s with %O.', event, payload);
        // Should not break down.
        try {
            this.#eventBus.emit(event, payload);
        } catch {
            //
        }
        return this;
    }

    public on<T extends keyof LifecycleEvent>(
        event: T,
        listener: (event: LifecycleEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.on(event, listener, context);
        return this;
    }

    public once<T extends keyof LifecycleEvent>(
        event: T,
        listener: (event: LifecycleEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.once(event, listener, context);
        return this;
    }

    public off<T extends keyof LifecycleEvent>(
        event: T,
        listener: (event: LifecycleEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.off(event, listener, context);
        return this;
    }

    public get api(): LifecycleAPI<CustomProps> {
        const getCustomProps = (): CustomProps => this.customProps;
        const getFns = (): LifecycleFns<CustomProps> | null => this.fns;
        const getHistory = (): LifecycleHistory[] => this.#history;

        if (!this.#apiInstance) {
            this.#apiInstance = Object.freeze({
                hooks: this.hooks,
                get customProps(): CustomProps {
                    return getCustomProps();
                },
                get history(): LifecycleHistory[] {
                    return getHistory();
                },
                fns: Object.freeze({
                    call: (
                        fnName: keyof LifecycleFns<CustomProps>,
                        arg: CustomProps,
                        allowUndefined?: boolean,
                        each?: (index: number, total: number) => void
                    ): Promise<void> => {
                        return this.#callLifecycleFn(fnName, arg, allowUndefined, each);
                    },
                    get raw(): LifecycleFns<CustomProps> | null {
                        return getFns();
                    },
                }),
                on: (...args): LifecycleAPI<CustomProps> => {
                    this.on(...args);
                    return this.api;
                },
                once: (...args): LifecycleAPI<CustomProps> => {
                    this.once(...args);
                    return this.api;
                },
                off: (...args): LifecycleAPI<CustomProps> => {
                    this.off(...args);
                    return this.api;
                },
            });
        }

        return this.#apiInstance;
    }

    public async bootstrap(): Promise<void> {
        this.debug('Call bootstrap().');

        await promiseIgnoreCatch(this.hooks.beforebootstrap.promise());

        try {
            if ('undefined' === typeof (await this.hooks.bootstrap.promise())) {
                await this.#callLifecycleFn('bootstrap', this.customProps, true);
            }
        } catch (error: unknown) {
            await promiseIgnoreCatch(this.hooks.bootstraperror.promise(error as AppError));
            throw error;
        }

        await promiseIgnoreCatch(this.hooks.afterbootstrap.promise());
    }

    public async mount(): Promise<void> {
        this.debug('Call mount().');
        await promiseIgnoreCatch(this.hooks.beforemount.promise());

        try {
            if ('undefined' === typeof (await this.hooks.mount.promise())) {
                await this.#callLifecycleFn('mount', this.customProps, false);
            }
        } catch (error: unknown) {
            await promiseIgnoreCatch(this.hooks.mounterror.promise(error as AppError));
            throw error;
        }

        await promiseIgnoreCatch(this.hooks.aftermount.promise());
    }

    public async unmount(): Promise<void> {
        this.debug('Call unmount().');
        await promiseIgnoreCatch(this.hooks.beforeunmount.promise());

        try {
            if ('undefined' === typeof (await this.hooks.unmount.promise())) {
                await this.#callLifecycleFn('unmount', this.customProps, false);
            }
        } catch (error: unknown) {
            await promiseIgnoreCatch(this.hooks.unmounterror.promise(error as AppError));
            throw error;
        }

        await promiseIgnoreCatch(this.hooks.afterunmount.promise());
    }

    public async update(customProps: CustomProps): Promise<void> {
        this.debug('Call update(%O).', customProps);

        await promiseIgnoreCatch(this.hooks.beforeupdate.promise({ props: customProps }));

        try {
            if ('undefined' === typeof (await this.hooks.update.promise({ props: customProps }))) {
                await this.#callLifecycleFn(
                    'update',
                    {
                        ...this.customProps,
                        ...customProps,
                    },
                    false
                );
            }
        } catch (error: unknown) {
            const err = error as AppError & { props: CustomProps };
            Reflect.defineProperty(err, 'props', {
                value: customProps,
            });
            await promiseIgnoreCatch(this.hooks.updateerror.promise(err));
            throw error;
        }

        await promiseIgnoreCatch(this.hooks.afterupdate.promise({ props: customProps }));
    }

    /**
     * Clear all states.
     * @returns Promise<void>
     */
    public clear(): Promise<unknown> | unknown {
        this.debug('Call clear().');
        this.#fns = null;
        this.#eventBus.removeAllListeners();
        return;
    }

    #callLifecycleFn(
        name: keyof LifecycleFns<CustomProps>,
        arg: CustomProps,
        allowUndefined?: boolean,
        each?: (index: number, total: number) => void
    ): Promise<void> {
        if (!this.#fns) {
            return Promise.reject(Error(`Lifecycle fns of ${this} has not been loaded yet.`));
        }

        const fns = toArray(this.#fns[name]).filter((fn): fn is LifecycleFn<CustomProps> => !!fn);

        if (!allowUndefined && fns.length === 0) {
            throw Error(`${this} has no ${name} lifecycle function.`);
        }

        const record: LifecycleHistory = { name, status: 'pending' };
        this.#history.push(record);

        return asyncSequence(
            fns,
            [
                {
                    ...arg,
                    ...this.#fixedProps,
                },
            ],
            null,
            (index: number) => {
                if (each) each(index, fns.length);
            }
        ).then(
            () => {
                record.status = 'success';
            },
            (err: Error) => {
                record.status = 'failed';
                throw err;
            }
        );
    }
}
