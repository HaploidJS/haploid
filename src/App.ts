/* eslint-disable prettier/prettier */
import EventEmitter from 'eventemitter3';

import { SyncBailHook, AsyncSeriesHook, AsyncSeriesBailHook, AsyncSeriesWaterfallHook } from './tapable/index';
import type { AppOptions, LifecycleFns, AppTimeouts, ChromeOptions, OptionsFromResolving } from './Def';
import { AppError, createInterruptedError } from './AppError';
import { getUniversalAppLoadAtomic } from './load-atomic';
import { Lifecycle, LifecycleAPI } from './Lifecycle';
import { ScriptNode, StyleNode } from './node/';
import { DEFAULE_TIMEOUTS } from './constant';
import { Chrome } from './chrome/Chrome';
import { Atomic } from './Atomic';

import { ProtectedEventEmitter } from './utils/ProtectedEventEmitter';
import { promiseIgnoreCatch } from './utils/promiseIgnoreCatch';
import { normalizeTransformable } from './utils/Transformable';
import { reasonableTime } from './utils/reasonableTime';
import { Debugger } from './utils/Debugger';

export interface AppEvent {
    statechange: { prevState: AppState; nextState: AppState };

    beforeload: void;
    afterload: void;
    loaderror: AppError;

    beforestart: void;
    afterstart: void;
    starterror: AppError;

    beforestop: void;
    afterstop: void;
    stoperror: AppError;

    beforeupdate: void;
    afterupdate: void;
    updateerror: AppError;

    beforeunload: void;
    afterunload: void;
    // TODO to be supported
    unloaderror: AppError;
}

// respect to single-spa
export enum AppState {
    NOT_LOADED = 'NOT_LOADED',
    LOADING_SOURCE_CODE = 'LOADING_SOURCE_CODE',
    NOT_BOOTSTRAPPED = 'NOT_BOOTSTRAPPED',
    BOOTSTRAPPING = 'BOOTSTRAPPING',
    NOT_MOUNTED = 'NOT_MOUNTED',
    MOUNTING = 'MOUNTING',
    MOUNTED = 'MOUNTED',
    UPDATING = 'UPDATING',
    UNMOUNTING = 'UNMOUNTING',
    UNLOADING = 'UNLOADING',
    LOAD_ERROR = 'LOAD_ERROR',
    SKIP_BECAUSE_BROKEN = 'SKIP_BECAUSE_BROKEN',
}

export enum AppDirective {
    IDLE = 'idle',
    START = 'start',
    STOP = 'stop',
    UPDATE = 'update',
    UNLOAD = 'unload',
}

type processStage = () => Promise<void>;

export type AppHooks = {
    encounterUnmountFailure: SyncBailHook<void, { ignore: boolean } | void>;
    encounterLoadingSourceCodeFailure: SyncBailHook<void, { retry: boolean; count: number } | void>;
    waitForLoadingOrBootstrappingWhenStop: SyncBailHook<void, { wait: boolean } | void>;
    /**
     * Hook that resolve assets, called only when app loading.
     */
    resolveAssets: AsyncSeriesBailHook<
        void,
        | (OptionsFromResolving & {
              scripts: ScriptNode[];
              styles: StyleNode[];
          })
        | void
    >;
    /**
     * Hook that resolve envVariables, called after resolveAssets.
     */
    resolveEnvVariables: AsyncSeriesWaterfallHook<Record<string, unknown>, Record<string, unknown>>;

    // The following will fire events
    beforeload: AsyncSeriesHook<void>;
    afterload: AsyncSeriesHook<void>;
    loaderror: AsyncSeriesHook<AppError>;

    beforestart: AsyncSeriesHook<void>;
    afterstart: AsyncSeriesHook<void>;
    starterror: AsyncSeriesHook<AppError>;

    beforestop: AsyncSeriesHook<void>;
    afterstop: AsyncSeriesHook<void>;
    stoperror: AsyncSeriesHook<AppError>;

    beforeupdate: AsyncSeriesHook<void>;
    afterupdate: AsyncSeriesHook<void>;
    updateerror: AsyncSeriesHook<AppError>;

    beforeunload: AsyncSeriesHook<void>;
    afterunload: AsyncSeriesHook<void>;
};

export interface AppAPI<AdditionalOptions, CustomProps> {
    get hooks(): AppHooks;
    get state(): AppState;
    get appElement(): HTMLElement | null;
    get name(): string;
    get latestDirective(): AppDirective;
    get timeouts(): AppTimeouts;
    readonly load: () => Promise<LifecycleFns<CustomProps>>;
    readonly on: <T extends keyof AppEvent>(
        event: T,
        listener: (event: AppEvent[T]) => unknown,
        context?: unknown
    ) => this;
    readonly once: <T extends keyof AppEvent>(
        event: T,
        listener: (event: AppEvent[T]) => unknown,
        context?: unknown
    ) => this;
    readonly off: <T extends keyof AppEvent>(
        event: T,
        listener: (event: AppEvent[T]) => unknown,
        context?: unknown
    ) => this;
    /**
     * Lifecycle object of this application.
     */
    lifecycle: LifecycleAPI<CustomProps>;
    /**
     * Options of this application.
     */
    options: AppOptions<CustomProps> & AdditionalOptions;
    /**
     * If is already unloaded.
     */
    isUnloaded: boolean;
    /**
     * Update this application with specified props.
     * @param customProps New props to update with.
     */
    update(customProps: CustomProps): Promise<void>;
}

export class App<AdditionalOptions = Record<never, never>, CustomProps = Record<never, never>>
    extends Debugger
    implements ProtectedEventEmitter<AppEvent>
{
    #internalState: AppState = AppState.NOT_LOADED;

    #startingPromise: Promise<void> | null = null;
    #stoppingPromise: Promise<void> | null = null;
    #updatingPromise: Promise<void> | null = null;
    #unloadingPromise: Promise<void> | null = null;

    readonly #eventBus = new EventEmitter<keyof AppEvent>();

    readonly #lifecycle: Lifecycle<CustomProps>;

    #latestDirective: AppDirective = AppDirective.IDLE;

    readonly #options: AppOptions<CustomProps> & AdditionalOptions;

    #apiInstance: AppAPI<AdditionalOptions, CustomProps> | null = null;

    #chrome: Chrome | null = null;

    readonly #atomic = new Atomic();

    public readonly hooks: AppHooks = Object.freeze({
        encounterUnmountFailure: new SyncBailHook<void, { ignore: boolean } | void>(),
        encounterLoadingSourceCodeFailure: new SyncBailHook<void, { retry: boolean; count: number } | void>(),
        waitForLoadingOrBootstrappingWhenStop: new SyncBailHook<void, { wait: boolean } | void>(),
        /**
         * Hook that resolve assets, called only when app loading.
         */
        resolveAssets: new AsyncSeriesBailHook<
            void,
            | (OptionsFromResolving & {
                  scripts: ScriptNode[];
                  styles: StyleNode[];
              })
            | void
        >(),
        /**
         * Hook that resolve envVariables, called after resolveAssets.
         */
        resolveEnvVariables: new AsyncSeriesWaterfallHook<Record<string, unknown>, Record<string, unknown>>(
            ['envVariables'],
            'resolveEnvVariables'
        ),

        // The following will fire events
        beforeload: new AsyncSeriesHook<void>(),
        afterload: new AsyncSeriesHook<void>(),
        loaderror: new AsyncSeriesHook<AppError>(['error'], 'loaderror'),

        beforestart: new AsyncSeriesHook<void>(),
        afterstart: new AsyncSeriesHook<void>(),
        starterror: new AsyncSeriesHook<AppError>(['error'], 'starterror'),

        beforestop: new AsyncSeriesHook<void>(),
        afterstop: new AsyncSeriesHook<void>(),
        stoperror: new AsyncSeriesHook<AppError>(['error'], 'stoperror'),

        beforeupdate: new AsyncSeriesHook<void>(),
        afterupdate: new AsyncSeriesHook<void>(),
        updateerror: new AsyncSeriesHook<AppError>(['error'], 'updateerror'),

        beforeunload: new AsyncSeriesHook<void>(),
        afterunload: new AsyncSeriesHook<void>(),
    });

    constructor(options: AppOptions<CustomProps> & AdditionalOptions) {
        super();

        Object.defineProperty(this, 'hooks', {
            enumerable: false,
            writable: false,
            configurable: false,
        });

        this.#options = { ...options }; // Copy.

        this.#lifecycle = new Lifecycle<CustomProps>({ ...options });

        for (const key of Object.keys(this.hooks) as Array<Extract<keyof AppHooks, keyof AppEvent>>) {
            if (/(^before|^after|error$)/.test(key))
                this.hooks[key].tap(`${this}`, arg => {
                    this.#emit<typeof key>(key, arg as AppEvent[typeof key]);
                });
        }
    }

    public get api(): AppAPI<AdditionalOptions, CustomProps> {
        const getOptions = (): AppOptions<CustomProps> & AdditionalOptions => this.#options;
        const getIsUnloaded = (): boolean => this.isUnloaded;
        const getState = (): AppState => this.state;
        const getTimeouts = (): AppTimeouts => this.timeouts;
        const getLastDirective = (): AppDirective => this.latestDirective;
        const getAppElement = (): HTMLElement | null => this.appElement;

        if (!this.#apiInstance) {
            this.#apiInstance = Object.freeze({
                get state(): AppState {
                    return getState();
                },
                get latestDirective(): AppDirective {
                    return getLastDirective();
                },
                get timeouts(): AppTimeouts {
                    return getTimeouts();
                },
                hooks: this.hooks,
                name: this.name,
                get appElement() {
                    return getAppElement();
                },
                load: (): Promise<LifecycleFns<CustomProps>> => {
                    return this.load();
                },
                on: <T extends keyof AppEvent>(
                    event: T,
                    listener: (event: AppEvent[T]) => unknown,
                    context?: unknown
                ): AppAPI<AdditionalOptions, CustomProps> => {
                    this.on(event, listener, context);
                    return this.api;
                },
                once: <T extends keyof AppEvent>(
                    event: T,
                    listener: (event: AppEvent[T]) => unknown,
                    context?: unknown
                ): AppAPI<AdditionalOptions, CustomProps> => {
                    this.once(event, listener, context);
                    return this.api;
                },
                off: <T extends keyof AppEvent>(
                    event: T,
                    listener: (event: AppEvent[T]) => unknown,
                    context?: unknown
                ): AppAPI<AdditionalOptions, CustomProps> => {
                    this.off(event, listener, context);
                    return this.api;
                },
                update: this.update.bind(this),
                lifecycle: this.lifecycle,
                get options() {
                    return getOptions();
                },
                get isUnloaded() {
                    return getIsUnloaded();
                },
            });
        }

        return this.#apiInstance;
    }

    public override get [Symbol.toStringTag](): string {
        return 'App';
    }

    public get options(): AppOptions<CustomProps> & AdditionalOptions {
        return this.#options;
    }

    public get appElement(): HTMLElement | null {
        return this.#chrome?.htmlElement ?? null;
    }

    public get name(): string {
        return this.#options.name;
    }

    public get state(): AppState {
        return this.#internalState;
    }

    public get lifecycle(): LifecycleAPI<CustomProps> {
        return this.#lifecycle.api;
    }

    public get latestDirective(): AppDirective {
        return this.#latestDirective;
    }

    public get isUnloaded(): boolean {
        return (
            AppDirective.UNLOAD === this.#latestDirective &&
            !this.#unloadingPromise &&
            this.state === AppState.NOT_LOADED
        );
    }

    public get timeouts(): AppTimeouts {
        return Object.assign({}, DEFAULE_TIMEOUTS, this.#options.timeouts);
    }

    protected override get debugName(): string {
        return `app:${this.name}`;
    }

    public on<T extends keyof AppEvent>(event: T, listener: (event: AppEvent[T]) => unknown, context?: unknown): this {
        this.#eventBus.on(event, listener, context);
        return this;
    }

    public once<T extends keyof AppEvent>(
        event: T,
        listener: (event: AppEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.once(event, listener, context);
        return this;
    }

    public off<T extends keyof AppEvent>(event: T, listener: (event: AppEvent[T]) => unknown, context?: unknown): this {
        this.#eventBus.off(event, listener, context);
        return this;
    }

    public override toString(): string {
        return `App(${this.name})`;
    }

    readonly #loadingLock = Object.create(null);
    /**
     * This function should support repeating without effects,
     * and it's concurrency-safe.
     * @returns Promise<LifecycleFns<CustomProps>>
     */
    public load(): Promise<LifecycleFns<CustomProps>> {
        this.debug('Call load().');

        const createLoad = async (): Promise<LifecycleFns<CustomProps>> => {
            if (this.#lifecycle.fns) {
                this.debug('Fns of lifecycle is already loaded.');
                return this.#lifecycle.fns;
            }

            await promiseIgnoreCatch(this.hooks.beforeload.promise());

            try {
                let lifecycle: LifecycleFns<CustomProps>;
                const assets = await this.hooks.resolveAssets.promise();
                const envVariables = await this.hooks.resolveEnvVariables.promise({});

                const { presetHeadHTML, presetBodyHTML, title, baseURI, lastModified } = assets ?? {};

                const chromeOptions: ChromeOptions = {
                    /* Can be overrided by setting. */
                    title,
                    presetHeadHTML,
                    presetBodyHTML,

                    ...this.options,

                    /* Cannot be overrided by setting. */
                    baseURI,
                    lastModified,

                    envVariables: {
                        __POWERED_BY_HAPLOID__: true,
                        ...envVariables,
                        ...this.options.envVariables,
                    },
                };

                const chrome = new Chrome(chromeOptions);

                // update domElement to app hooks
                this.#lifecycle.updateFixedProps({
                    domElement: chrome.bodyElement.firstElementChild ?? undefined,
                });

                if (assets) {
                    lifecycle = await chrome.open<CustomProps>(assets);
                } else if (this.options.lifecycle) {
                    lifecycle = await normalizeTransformable(this.options.lifecycle);
                } else {
                    throw Error('No lifecycle fns loaded.');
                }

                this.#lifecycle.setFns(lifecycle);

                this.#chrome = chrome;

                await promiseIgnoreCatch(this.hooks.afterload.promise());

                return lifecycle;
            } catch (err) {
                await promiseIgnoreCatch(this.hooks.loaderror.promise(err as AppError));
                throw err;
            }
        };

        return getUniversalAppLoadAtomic().wait(() => this.#atomic.waitFor(this.#loadingLock, createLoad));
    }

    /**
     * Start this application.
     *
     * This may interrupt stopping.
     * @returns Promise<void>
     */
    public start(): Promise<void> {
        const debug = this.#getApiDebug('start');
        debug('Call start() under state=%s.', this.state);

        if (this.#latestDirective === AppDirective.UNLOAD) {
            return Promise.reject(Error(`${this} cannot start if unload() called.`));
        }

        this.#latestDirective = AppDirective.START;

        const waitToStart = (): Promise<void> => {
            // If #latestDirective is stop/unload, we must cancel starting.
            if (this.#latestDirective === AppDirective.START || this.#latestDirective === AppDirective.UPDATE) {
                return this.start();
            }

            const cancelledMessage = `${this} starting cancelled by ${this.#latestDirective}.`;

            debug(cancelledMessage);

            throw Error(cancelledMessage);
        };

        // First check #updatingPromise, if it exists, we're sure other promises never exist.
        if (this.#updatingPromise) {
            debug('Wait for #updatingPromise to finish up.');
            // Wait for updating to finish up, then try to start.
            // Generally speaking, app in updating state is already started,
            // but updating can make app broken somehow, starting may still fail.
            return promiseIgnoreCatch(this.#updatingPromise).then(waitToStart);
        }

        // #startingPromise and #stoppingPromise can exist in the same time,
        // ⚠️ which one should be checked first?
        //
        // start-----------|
        // stop-------------------|
        // start           o------o
        //
        // start-----------|
        // stop-------------------|
        // start                  o
        //
        // start------------------|
        // stop------------|
        // start                  o
        //
        // start------------------|
        // stop------------|
        // start           o------o
        //
        // Let's see the cases above, whether checking #startingPromise first or #stoppingPromise
        // first, the final result is the same.
        //
        // If they both exist, #stoppingPromise is always created during #startingPromise,
        // and finished before #startingPromise, so checking #startPromise is a little better.

        if (this.#startingPromise) {
            debug('Wait for #startingPromise to finish up.');

            // Wait for starting to finish up, then try to start again.
            // ⚠️ The previous startingPromise may be interrupted, we can't trust it.
            return promiseIgnoreCatch(this.#startingPromise).then(waitToStart);
        }

        if (this.#stoppingPromise) {
            debug('Wait for #stoppingPromise to finish up.');

            // Wait for stopping to finish up, then try to start.
            // Setting #latestDirective is expected to interrupt stopping,
            // which perhaps makes #stoppingPromise to finish up earlier.
            return promiseIgnoreCatch(this.#stoppingPromise).then(waitToStart);
        }

        // No other promises exist now, we check the state.

        switch (this.state) {
            /* eslint-disable no-fallthrough */
            /* istanbul ignore next: never be this state */
            case AppState.MOUNTING:
            /* istanbul ignore next: never be this state */
            case AppState.LOADING_SOURCE_CODE:
            /* istanbul ignore next: never be this state */
            case AppState.BOOTSTRAPPING:
            /* istanbul ignore next: never be this state */
            case AppState.UNMOUNTING:
            /* istanbul ignore next: never be this state */
            case AppState.UNLOADING:
            /* istanbul ignore next: never be this state */
            case AppState.UPDATING:
                // There must be one of #startingPromise/#stoppingPromise/#unloadingPromise exists.
                return Promise.reject(Error(`${this} never hits ${this.state} in starting.`));
            /* eslint-enable no-fallthrough */
            case AppState.MOUNTED:
                // The app has already mounted, we needn't start again, return immediately.
                // Notice that when MOUNTED, the #startingPromise may not have been fulfilled, but we have checked it above.
                debug('Start() is finished immediately cause state=%s can be treated as started.', this.state);
                return Promise.resolve();
            case AppState.SKIP_BECAUSE_BROKEN:
                return Promise.reject(Error(`${this} cannot start when broken.`));
        }

        // Now this.state can only be NOT_*

        const processLoadingSourceCode: processStage = () => {
            // interruptable
            if (this.#latestDirective === AppDirective.STOP || this.#latestDirective === AppDirective.UNLOAD) {
                throw createInterruptedError(
                    `${this} starting interrupted by ${this.#latestDirective}() before loading source code.`
                );
            }

            debug('Now loading source code.');

            this.#state = AppState.LOADING_SOURCE_CODE;
            return reasonableTime(this.load(), this.timeouts.load, `${this} loading timeout of %dms.`).then();
        };

        const processBootstrapping: processStage = () => {
            this.#state = AppState.NOT_BOOTSTRAPPED;

            // interruptable
            if (this.#latestDirective === AppDirective.STOP || this.#latestDirective === AppDirective.UNLOAD) {
                throw createInterruptedError(
                    `${this} starting interrupted by ${this.#latestDirective}() before bootstrapping.`
                );
            }

            debug('Now bootstrapping.');

            this.#state = AppState.BOOTSTRAPPING;

            return reasonableTime(
                this.#lifecycle.bootstrap(),
                this.timeouts.bootstrap,
                `${this} bootstrapping timeout of %dms.`
            );
        };

        const processMounting: processStage = () => {
            this.#state = AppState.NOT_MOUNTED;

            // interruptable
            if (this.#latestDirective === AppDirective.STOP || this.#latestDirective === AppDirective.UNLOAD) {
                throw createInterruptedError(
                    `${this} starting interrupted by ${this.#latestDirective}() before mounting.`
                );
            }

            debug('Now mounting.');

            this.#state = AppState.MOUNTING;

            return reasonableTime(this.#lifecycle.mount(), this.timeouts.mount, `${this} mounting timeout of %dms.`);
        };

        debug("Let's create #startingPromise.");

        let startingPromise: Promise<void>;

        switch (this.state) {
            case AppState.LOAD_ERROR:
            case AppState.NOT_LOADED:
                startingPromise = Promise.resolve()
                    .then(processLoadingSourceCode)
                    .then(processBootstrapping)
                    .then(processMounting);
                break;
            case AppState.NOT_BOOTSTRAPPED:
                startingPromise = Promise.resolve().then(processBootstrapping).then(processMounting);
                break;
            case AppState.NOT_MOUNTED:
                startingPromise = Promise.resolve().then(processMounting);
                break;
        }

        this.#startingPromise = promiseIgnoreCatch(this.hooks.beforestart.promise())
            .then(() => startingPromise)
            .then(
                () => {
                    debug('Mounted.');
                    this.#state = AppState.MOUNTED;
                    return promiseIgnoreCatch(this.hooks.afterstart.promise());
                },
                (err: AppError) => {
                    debug('Encounter error: %O.', err);

                    if (err.interrupted) {
                        debug('Starting is interrupted.');
                    }

                    if (err.interrupted) {
                        if (this.state === AppState.MOUNTING) {
                            debug('Unmount immediately when mounting interrupted.');
                            // REVIEW is unmount necessary?
                            // Interrupted in mounting indicates that there is a stop/unload following.
                            return promiseIgnoreCatch(this.#lifecycle.unmount()).then(() => {
                                this.#state = AppState.NOT_MOUNTED;

                                throw err;
                            });
                        } else {
                            // NOT_LOADED/NOT_BOOTSTRAPPED/NOT_MOUNTED/LOAD_ERROR
                            debug("Don't change state when interrupted beside mounting.");
                            throw err;
                        }
                    } else {
                        if (this.state === AppState.MOUNTING) {
                            debug('Unmount immediately when mounting failed.');
                            return promiseIgnoreCatch(this.#lifecycle.unmount()).then(() => {
                                this.#state = AppState.SKIP_BECAUSE_BROKEN;

                                throw err;
                            });
                        } else if (this.state === AppState.LOADING_SOURCE_CODE) {
                            const failure = this.hooks.encounterLoadingSourceCodeFailure.call();
                            if (failure?.retry) {
                                debug(
                                    `Set state to LOAD_ERROR when loading source code failed(count: ${failure.count}).`
                                );
                                this.#state = AppState.LOAD_ERROR;

                                throw err;
                            }
                        }
                    }

                    this.#state = AppState.SKIP_BECAUSE_BROKEN;

                    throw err;
                }
            )
            .catch((error: AppError) =>
                promiseIgnoreCatch(this.hooks.starterror.promise(error)).then(() => Promise.reject(error))
            )
            .finally(() => {
                debug('Clear #startingPromise.');
                this.#startingPromise = null;
            });

        return this.#startingPromise;
    }

    /**
     * Stop this application.
     *
     * This may interrupt starting or updating.
     * @returns Promise<void>
     */
    public stop(): Promise<void> {
        const debug = this.#getApiDebug('stop');
        debug('Call stop() under state=%s.', this.state);

        if (this.#latestDirective === AppDirective.UNLOAD) {
            return Promise.reject(Error(`${this} cannot stop if unload() called.`));
        }

        this.#latestDirective = AppDirective.STOP;

        const waitToStop = (): Promise<void> => {
            if (this.#latestDirective === AppDirective.STOP || this.#latestDirective === AppDirective.UNLOAD) {
                return this.stop();
            }

            const cancelledMessage = `${this} stopping cancelled by ${this.#latestDirective}.`;

            debug(cancelledMessage);

            throw Error(cancelledMessage);
        };

        if (this.#stoppingPromise) {
            debug('Wait for #stoppingPromise to finish up.');
            // Wait for stopping to finish up, then try to stop again.
            // ⚠️ The previous #stoppingPromise may be interrupted, so we can't trust it.
            return promiseIgnoreCatch(this.#stoppingPromise).then(waitToStop);
        }

        if (this.#updatingPromise) {
            debug('Wait for #updatingPromise to finish up.');

            // Wait for updating to finish up, then try to stop.
            // Setting #latestDirective is expected to interrupt updating,
            // which makes #updatingPromise to finish up earlier.
            return promiseIgnoreCatch(this.#updatingPromise).then(waitToStop);
        }

        switch (this.state) {
            /* eslint-disable no-fallthrough */
            /* istanbul ignore next: never be this state */
            case AppState.UNLOADING: // next NOT_LOADED
            /* istanbul ignore next: never be this state */
            case AppState.UNMOUNTING: // NOT_MOUNT or SKIP_BECAUSE_BROKEN
            /* istanbul ignore next: never be this state */
            case AppState.UPDATING: // next MOUNTED or SKIP_BECAUSE_BROKEN
                // There must be one of #updatingPromise/#stoppingPromise/#unloadingPromise exists.
                return Promise.reject(Error(`${this} never hits ${this.state} in stopping.`));
            /* eslint-enable no-fallthrough */
            case AppState.LOAD_ERROR:
            case AppState.SKIP_BECAUSE_BROKEN:
                // Notice that the #startingPromise may not have been finished
                debug('Stop() is finished immediately cause state=%s can be treated as stopped.', this.state);

                if (!this.#startingPromise) {
                    return Promise.resolve();
                }

                /* istanbul ignore next: difficult to enter  */
                break;
            case AppState.NOT_LOADED: // next LOADING_SOURCE_CODE
            case AppState.NOT_BOOTSTRAPPED: // next BOOTSTRAPPING
            case AppState.NOT_MOUNTED: // next MOUNTING
                debug(
                    'Stop() is finished immediately cause under state=%s, even #startingPromise exists, it will be interrupted soon.',
                    this.state
                );

                if (!this.#startingPromise) {
                    return Promise.resolve();
                }

                break;
            case AppState.LOADING_SOURCE_CODE: // next NOT_BOOTSTRAPPED or SKIP_BECAUSE_BROKEN
            case AppState.BOOTSTRAPPING: // next NOT_MOUNTED or SKIP_BECAUSE_BROKEN
                if (this.hooks.waitForLoadingOrBootstrappingWhenStop.call()?.wait) {
                    debug('Wait for loading or bootstrapping to finish up when stopping.');
                    break;
                }
                // Under these states, we don't have to wait for "#startingPromise" to finish up,
                // cause we assume that app under these states do not use domElement.
                // But this means that the "#state" may not be xING after stop.
                debug(
                    "stop() is finished immediately cause under state=%s, even #startingPromise exists, it's final state all can be treated as stopped",
                    this.state
                );
                return Promise.resolve();
        }

        // The existing of #startingPromise does not always block stopping.
        // In fact, states beyond MOUNTING all do not have to block.
        // The starting can still run, until it has chance to check #latestDirective.
        if (this.#startingPromise) {
            debug('Wait for #startingPromise to finish up.');
            // The state may be MOUNTING/NOT_LOADED/NOT_BOOTSTRAPPED/NOT_MOUNTED here.
            // Wait for starting to finish up, then try to stop.
            // Setting #latestDirective is expected to interrupt starting,
            // which makes #startingPromise to finish up earlier.
            return promiseIgnoreCatch(this.#startingPromise).then(waitToStop);
        }

        switch (this.state) {
            /* istanbul ignore next: will never hit MOUNTING */
            case AppState.MOUNTING:
                return Promise.reject(Error(`${this} never hits ${this.state} in stopping.`));
        }

        // this.state almost can only be MOUNTED

        // A stoppingPromise is allowed to be created when state is LOADING_SOURCE_CODE or BOOTSTRAPPING.
        // So stoppingPromise and startingPromise can exist in the same time, which brings some conflicts to handle.
        debug("Let's create #stoppingPromise.");

        this.#stoppingPromise = promiseIgnoreCatch(this.hooks.beforestop.promise())
            .then(() => {
                // interruptable
                if (this.#latestDirective === AppDirective.START || this.#latestDirective === AppDirective.UPDATE) {
                    throw createInterruptedError(
                        `${this} stopping interrupted by ${this.#latestDirective}() before unmounting.`
                    );
                }

                debug('Now unmounting.');
                this.#state = AppState.UNMOUNTING;

                return reasonableTime(
                    this.#lifecycle.unmount(),
                    this.timeouts.unmount,
                    `${this} unmounting timeout of %dms.`
                ).catch(err => {
                    const failure = this.hooks.encounterUnmountFailure.call();
                    if (failure?.ignore) {
                        return;
                    }

                    throw err;
                });
            })
            .then(
                () => {
                    debug('Not mounted.');
                    this.#state = AppState.NOT_MOUNTED;
                    return promiseIgnoreCatch(this.hooks.afterstop.promise());
                },
                (err: AppError) => {
                    debug('Encounter error: %O.', err);

                    if (err.interrupted) {
                        /* istanbul ignore if: unmount lifecycle cannot be suspended */
                        if (this.state === AppState.UNMOUNTING) {
                            debug('Stopping is interrupted inside lifecycle fns.');
                        } else {
                            debug('Stopping is interrupted outside lifecycle fns.');
                        }
                    } else {
                        this.#state = AppState.SKIP_BECAUSE_BROKEN;
                    }

                    return promiseIgnoreCatch(this.hooks.stoperror.promise(err)).then(() => Promise.reject(err));
                }
            )
            .finally(() => {
                debug('Clear #stoppingPromise.');
                this.#stoppingPromise = null;
            });

        return this.#stoppingPromise;
    }

    /**
     * Update this application with properties.
     *
     * This may interrupt stopping.
     * @param customProps Properties to update with.
     * @returns Promise<void>
     */
    public update(customProps: CustomProps): Promise<void> {
        const debug = this.#getApiDebug('update');
        debug('Call update(%O) under state=%s.', customProps, this.state);

        if (this.#latestDirective === AppDirective.UNLOAD) {
            return Promise.reject(Error(`${this} cannot update if unload() called.`));
        }

        this.#latestDirective = AppDirective.UPDATE;

        const waitToUpdate = (): Promise<void> => {
            // If #latestDirective is stop/unload, we must cancel updating.
            if (this.#latestDirective === AppDirective.UPDATE || this.#latestDirective === AppDirective.START) {
                return this.update(customProps);
            }

            const cancelledMessage = `${this} updating cancelled by ${this.#latestDirective}.`;

            debug(cancelledMessage);

            throw Error(cancelledMessage);
        };

        if (this.#updatingPromise) {
            debug('Wait for #updatingPromise to finish up.');

            // Wait for previous updating to finish up, then try to update again.
            return promiseIgnoreCatch(this.#updatingPromise).then(waitToUpdate);
        }

        if (this.#startingPromise) {
            debug('Wait for #startingPromise to finish up.');

            // Wait for starting to finish up, then try to update.
            return promiseIgnoreCatch(this.#startingPromise).then(waitToUpdate);
        }

        if (this.#stoppingPromise) {
            debug('Wait for #stoppingPromise to finish up.');

            // Wait for stopping to finish up, then try to update.
            // Setting #latestDirective is expected to interrupt stopping,
            // which makes #stoppingPromise to finish up earlier.
            return promiseIgnoreCatch(this.#stoppingPromise).then(waitToUpdate);
        }

        switch (this.state) {
            case AppState.NOT_LOADED:
            case AppState.NOT_BOOTSTRAPPED:
            case AppState.NOT_MOUNTED:
            case AppState.LOAD_ERROR:
            case AppState.SKIP_BECAUSE_BROKEN:
                return Promise.reject(Error(`${this} cannot update in ${this.state}.`));
            /* eslint-disable no-fallthrough */
            /* istanbul ignore next: never be this state */
            case AppState.BOOTSTRAPPING:
            /* istanbul ignore next: never be this state */
            case AppState.LOADING_SOURCE_CODE:
            /* istanbul ignore next: never be this state */
            case AppState.MOUNTING:
            /* istanbul ignore next: never be this state */
            case AppState.UNMOUNTING:
            /* istanbul ignore next: never be this state */
            case AppState.UNLOADING:
            /* istanbul ignore next: never be this state */
            case AppState.UPDATING:
                // Under these states, existing of one of #startingPromise/#stoppingPromise/#unloadingPromise/#unloadingPromise is expected.
                return Promise.reject(Error(`${this} never hits ${this.state} in updating.`));
            /* eslint-enable no-fallthrough */
        }

        debug("Let's create #updatingPromise.");

        this.#updatingPromise = promiseIgnoreCatch(this.hooks.beforeupdate.promise())
            .then(() => {
                if (this.#latestDirective === AppDirective.STOP || this.#latestDirective === AppDirective.UNLOAD) {
                    throw createInterruptedError(
                        `${this} updating interrupted by ${this.#latestDirective}() before updating.`
                    );
                }

                debug('Now updating.');

                this.#state = AppState.UPDATING;
                return reasonableTime(
                    this.#lifecycle.update(customProps),
                    this.timeouts.update,
                    `${this} updating timeout of %dms.`
                );
            })
            .then(() => {
                debug('Updated.');
                this.#state = AppState.MOUNTED;
                return promiseIgnoreCatch(this.hooks.afterupdate.promise());
            })
            .catch((err: AppError) => {
                debug('Encounter error: %O.', err);

                if (err.interrupted) {
                    if (this.state === AppState.UPDATING) {
                        debug('Updating is interrupted inside lifecycle fns.');
                    } else {
                        debug('Updating is interrupted outside lifecycle fns.');
                    }
                    // set MOUNTED when updating interrupted for next stopping/unloading
                    this.#state = AppState.MOUNTED;
                } else {
                    this.#state = AppState.SKIP_BECAUSE_BROKEN;
                }

                return promiseIgnoreCatch(this.hooks.updateerror.promise(err)).then(() => Promise.reject(err));
            })
            .finally(() => {
                debug('Clear #updatingPromise.');
                this.#updatingPromise = null;
            });

        return this.#updatingPromise;
    }

    /**
     * Unload this application.
     *
     * This may interrupt starting or updating.
     *
     * If unload() is called, other operations like start/update/stop would never be allowed again.
     * @returns Promise<void>
     */
    public unload(): Promise<void> {
        const debug = this.#getApiDebug('unload');
        debug('Call unload() under state=%s.', this.state);

        this.#latestDirective = AppDirective.UNLOAD;

        const otherPromise =
            this.#unloadingPromise || this.#updatingPromise || this.#startingPromise || this.#stoppingPromise;

        if (otherPromise) {
            debug('Wait for other promise to finish up.');

            // Wait for others to finish up, then try to unload.
            return promiseIgnoreCatch(otherPromise).then(() => {
                // Don't need to check #latestDirective because it has been locked to be UNLOAD.
                return this.unload();
            });
        }

        debug("Let's create #unloadingPromise.");

        this.#unloadingPromise = promiseIgnoreCatch(this.hooks.beforeunload.promise())
            .then(() => {
                this.debug('Start unloading.');
                const lastLifecycleFn = this.lifecycle.history[this.lifecycle.history.length - 1];
                this.#state = AppState.UNLOADING;
                return promiseIgnoreCatch(
                    reasonableTime(
                        // Don't call unmount duplicatly.
                        lastLifecycleFn && lastLifecycleFn.name === 'unmount' && lastLifecycleFn.status === 'success'
                            ? Promise.resolve()
                            : this.#lifecycle.unmount(),
                        this.timeouts.unmount,
                        `${this} unmounting timeout of %dms.`
                    )
                );
            })
            .then(() => {
                // Don't need to wait, since it has no effect.
                this.#lifecycle.clear();
                this.#chrome?.close();
                this.#eventBus.removeAllListeners();
                return promiseIgnoreCatch(this.hooks.afterunload.promise());
            })
            .finally(() => {
                debug('Not loaded.');
                this.#state = AppState.NOT_LOADED;
                debug('Clear #unloadingPromise.');
                this.#unloadingPromise = null;
            });

        return this.#unloadingPromise;
    }

    #emit<T extends keyof AppEvent>(event: T, payload: AppEvent[T]): void {
        this.debug('Emit %s with %O.', event, payload);
        // Should not break down.
        try {
            this.#eventBus.emit(event, payload);
        } catch {
            //
        }
    }

    set #state(nextState: AppState) {
        const prevState = this.#internalState;

        this.#internalState = nextState;

        if (prevState !== nextState) {
            this.#emit('statechange', {
                prevState,
                nextState,
            });
        }
    }

    #debuggerIdx = 0;

    #getApiDebug(fnName: string): ReturnType<debug.Debug> {
        return this.debug.extend(fnName).extend((++this.#debuggerIdx).toString(16).toUpperCase().padStart(5, '0'));
    }
}
