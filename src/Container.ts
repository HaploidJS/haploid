import EventEmitter from 'eventemitter3';

import { __HAPLOID_GLOBAL_MAP_DOM_CONTAINER__, DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY } from './constant';
import { AsyncSeriesBailHook } from './tapable/index';
import { setupAppLoadAtomic } from './load-atomic';
import { getUniversalDevTool } from './DevTool';
import { App, AppAPI, AppState } from './App';
import type { AppPlugin } from './Plugin';
import type { AppOptions } from './Def';

import { createRetryLoadingSourceCodePlugin } from './plugins/RetryLoadingSourceCodePlugin';
import { createIgnoreUnmountFailurePlugin } from './plugins/IgnoreUnmountFailurePlugin';
import { createLoadFromAssetsMapPlugin } from './plugins/LoadFromAssetsMapPlugin';
import { createLoadFromEntryPlugin } from './plugins/LoadFromEntryPlugin';
import { createAttachDOMPlugin } from './plugins/AttachDOMPlugin';
import { createSafeModePlugin } from './plugins/SafeModePlugin';
import { createPreloadPlugin } from './plugins/PreloadPlugin';

import { simpleRequestIdleCallback } from './utils/simpleRequestIdleCallback';
import { simplePromiseAllSettled } from './utils/simplePromiseAllSettled';
import { ProtectedEventEmitter } from './utils/ProtectedEventEmitter';
import { ensureGlobalWeakMap } from './utils/ensureGlobalMap';
import { baseDebugger, Debugger } from './utils/Debugger';
import { LRUStorage } from './utils/LRU-Storage';

const globalDevTool = getUniversalDevTool();

export interface ContainerEvent {
    destroying: void;
    destroyed: void;

    appactivating: { appname: string | null };
    appactivated: { appname: string };
    appactivateerror: { appname: string; error: Error };
    noappactivated: { error: Error };

    appregisteredchange: void;

    appregistererror: { error: Error };
}

interface ContainerBaseOptions {
    name: string;
    root: string | Element;
    maxLoadConcurrency?: number;
    preload?:
        | boolean
        | 'auto'
        | {
              expire?: number;
              max?: number;
              top?: number;
              onExceed?: (key: string) => void;
          };
}

export type ContainerHooks = {
    afterrootready: AsyncSeriesBailHook<{ source: unknown }, void>;
};

export abstract class Container<ContainerAdditionalOptions, AppAdditionalOptions>
    extends Debugger
    implements ProtectedEventEmitter<ContainerEvent>
{
    readonly #options: ContainerBaseOptions & ContainerAdditionalOptions;

    readonly #apps: App<AppAdditionalOptions, unknown>[] = [];
    readonly #appNameRegistry: Set<string> = new Set();

    readonly #eventBus = new EventEmitter<keyof ContainerEvent>();

    #lastAppNameTryingActivate: string | null = '__initial_0x0810__';

    #destroying = false;
    #destroyed = false;

    #destroyPromise: Promise<void> | null = null;

    readonly #domContainerRecord = ensureGlobalWeakMap<Node, Container<unknown, unknown>>(
        __HAPLOID_GLOBAL_MAP_DOM_CONTAINER__
    );

    public readonly hooks: ContainerHooks = Object.freeze({
        afterrootready: new AsyncSeriesBailHook<{ source: unknown }, void>(['arg']),
    });

    readonly #lru: LRUStorage;

    constructor(options: ContainerBaseOptions & ContainerAdditionalOptions) {
        super();
        this.#options = Object.assign(
            {
                maxLoadConcurrency: window.__HAPLOID_MAX_LOAD_CONCURRENCY__,
            },
            options
        );

        const rootDOM = this.#options.root;

        if ('object' === typeof options.preload) {
            this.#lru = new LRUStorage({
                ...options.preload,
                storageKey: options.name,
            });
        } else {
            this.#lru = new LRUStorage({
                storageKey: options.name,
            });
        }

        {
            let maxLoadConcurrency = parseInt(String(this.#options.maxLoadConcurrency), 10);
            if (isNaN(maxLoadConcurrency) || maxLoadConcurrency < 1)
                maxLoadConcurrency = DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY;
            setupAppLoadAtomic(maxLoadConcurrency);
        }

        // Only record if not string
        if ('string' !== typeof rootDOM) {
            if (this.#domContainerRecord.has(rootDOM)) {
                const container = this.#domContainerRecord.get(rootDOM);

                if ('string' === typeof rootDOM) {
                    throw Error(`${rootDOM} has already been attached to ${container}.`);
                } else {
                    const clonedNode = rootDOM.cloneNode(false) as Element;
                    clonedNode.innerHTML = '';

                    throw Error(`${clonedNode.outerHTML} has already been attached to ${container}.`);
                }
            }
            this.#domContainerRecord.set(rootDOM, this);
        }

        simpleRequestIdleCallback(
            () => {
                try {
                    this.throwErrorIfDestroy();
                    globalDevTool.notifyContainerCreated(this);
                } catch {
                    //
                }
            },
            { timeout: 1000 }
        );

        Object.defineProperty(this, 'hooks', {
            enumerable: false,
            writable: false,
            configurable: false,
        });
    }

    get #isAutoPreload(): boolean {
        const { preload } = this.#options;

        return preload === 'auto' || typeof preload === 'object';
    }

    public abstract get [Symbol.toStringTag](): string;

    public get apps(): AppAPI<AppAdditionalOptions, unknown>[] {
        return this.#apps.map(app => app.api);
    }

    protected get appsOtherThanAPI(): App<AppAdditionalOptions, unknown>[] {
        return this.#apps;
    }

    public get name(): string {
        return this.#options.name;
    }

    public get options(): ContainerBaseOptions & ContainerAdditionalOptions {
        return this.#options;
    }

    public get currentMountedApp(): AppAPI<AppAdditionalOptions, unknown> | null {
        return this.apps.find(app => app.state === AppState.MOUNTED) ?? null;
    }

    public get currentActiveApp(): AppAPI<AppAdditionalOptions, unknown> | null {
        return this.apps.find(app => app.name === this.#lastAppNameTryingActivate) ?? null;
    }

    public get isDestroying(): boolean {
        return this.#destroying;
    }

    public get isDestroyed(): boolean {
        return this.#destroyed;
    }

    public on<T extends keyof ContainerEvent>(
        event: T,
        listener: (event: ContainerEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.throwErrorIfDestroy();

        this.#eventBus.on(event, listener, context);
        return this;
    }

    public once<T extends keyof ContainerEvent>(
        event: T,
        listener: (event: ContainerEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.throwErrorIfDestroy();

        this.#eventBus.once(event, listener, context);
        return this;
    }

    public off<T extends keyof ContainerEvent>(
        event: T,
        listener: (event: ContainerEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.throwErrorIfDestroy();

        this.#eventBus.off(event, listener, context);
        return this;
    }

    #hotKeys: string[] | null = null;

    /**
     * Get hot-visited app names.
     * @returns string[]
     */
    public getHotVisitApps(): string[] {
        if (this.#hotKeys) return this.#hotKeys;

        try {
            this.#hotKeys = this.#lru.getCollection();
            this.debug('LRU collection [%s].', this.#hotKeys.join());
        } catch (e) {
            this.debug('LRU error: %o.', e);
            this.#hotKeys = [];
        }

        return this.#hotKeys;
    }

    /**
     * Create and register applications.
     * @param apps App definations to create applications from.
     * @param plugins Plugins to be installed into each application.
     * @returns The created applications.
     */
    public registerApps<CustomProps = Record<never, never>, AdditionalOptions = Record<never, never>>(
        apps: Array<AppOptions<CustomProps> & AppAdditionalOptions & AdditionalOptions>,
        plugins: Array<[name: string, pluginFn: AppPlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>]> = []
    ): AppAPI<AppAdditionalOptions & AdditionalOptions, CustomProps>[] {
        this.debug('Call registerApps(%O).', apps);

        this.throwErrorIfDestroy();

        if (plugins && !Array.isArray(plugins)) {
            throw Error(`The plugins parameter when ${this} registerApps must be an array.`);
        }

        const internalPlugins: Array<
            [name: string, pluginFn: AppPlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>]
        > = [
            [
                'LoadFromAssetsMapPlugin',
                createLoadFromAssetsMapPlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>(),
            ],
            ['LoadFromEntryPlugin', createLoadFromEntryPlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>()],
            ['PreloadPlugin', createPreloadPlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>()],
            [
                'IgnoreUnmountFailurePlugin',
                createIgnoreUnmountFailurePlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>(),
            ],
            [
                'RetryLoadingSourceCodePlugin',
                createRetryLoadingSourceCodePlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>(),
            ],
            [
                'AttachDOMPlugin',
                createAttachDOMPlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>(this.#options.root),
            ],
            ['SafeModePlugin', createSafeModePlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>()],
        ];

        const getPreload = (key: string): boolean | undefined => {
            let preload: boolean | undefined = undefined;

            if (true === this.#options.preload) {
                preload = true;
            } else if (false === this.#options.preload) {
                preload = false;
            } else if (this.#isAutoPreload) {
                preload = this.getHotVisitApps().includes(key) ? true : undefined;
            }

            return preload;
        };

        const newApps = apps
            .map(appOptions => {
                try {
                    if (this.#appNameRegistry.has(appOptions.name)) {
                        throw Error(
                            `The name ${appOptions.name} as an app name has been registered before in ${this}.`
                        );
                    }

                    const app = new App<AppAdditionalOptions & AdditionalOptions, CustomProps>(
                        Object.assign({ preload: getPreload(appOptions.name) }, appOptions)
                    );

                    for (const [name, plugin] of [...plugins, ...internalPlugins]) {
                        plugin({ app: app.api, debug: baseDebugger.extend(`${name}(${app.name})`) });
                    }

                    this.#appNameRegistry.add(app.name);
                    return app;
                } catch (error) {
                    // Register failed does not break down.
                    console.warn(`Unexpected error occurred when register ${appOptions.name}:`, error);
                    this.#emit('appregistererror', { error: error as Error });
                    return null;
                }
            })
            .filter((app): app is App<AppAdditionalOptions & AdditionalOptions, CustomProps> => app !== null);

        // Use proxy to be reactive.
        this.#appsProxy.push(...(newApps as App<AppAdditionalOptions, unknown>[]));

        return newApps
            .map(app => app.api)
            .map(api => {
                if (this.#isAutoPreload) {
                    api.on('afterstart', () => {
                        this.#lru.touch(api.name);
                    });
                }
                return api;
            });
    }

    /**
     * Create and register an application.
     * @param app App defination to create application from.
     * @param plugins Plugins to be installed into the application.
     * @returns The created application.
     */
    public registerApp<CustomProps = Record<never, never>, AdditionalOptions = Record<never, never>>(
        app: AppOptions<CustomProps> & AppAdditionalOptions & AdditionalOptions,
        plugins: Array<[name: string, pluginFn: AppPlugin<AppAdditionalOptions & AdditionalOptions, CustomProps>]> = []
    ): AppAPI<AppAdditionalOptions & AdditionalOptions, CustomProps> {
        return this.registerApps<CustomProps, AdditionalOptions>([app], plugins)[0];
    }

    /**
     * Unregister an application.
     * @param name Name of the application to be registered.
     * @returns Promise<void>
     */
    public unregisterApp(name: string): Promise<void> {
        this.debug('Call unregisterApp(%s).', name);
        const idx = this.#appsProxy.findIndex(app => app.name === name);

        if (-1 === idx) {
            return Promise.reject(Error(`Cannot find app ${name} when ${this} unregisterApps.`));
        }

        const app = this.#appsProxy[idx];

        return app.unload().then(() => {
            this.debug('Unload app %s completed, now remove it from registery.');
            // Use proxy to be reactive.
            this.#appsProxy.splice(idx, 1);
            this.#appNameRegistry.delete(name);
        });
    }

    public override toString(): string {
        return `${this[Symbol.toStringTag]}(${this.name})`;
    }

    protected activateAppByName(
        name: string | null,
        source: unknown
    ): Promise<App<AppAdditionalOptions, unknown> | null> {
        this.debug('Call activateAppByName(%s).', name);

        this.#lastAppNameTryingActivate = name;

        const appToBeActivated = this.#apps.find(app => app.name === name) ?? null;

        const appsToStop = this.#apps.filter(app => app !== appToBeActivated);

        // Emit appactivating whether there is an app to be activated.
        this.#emit('appactivating', { appname: appToBeActivated?.name ?? null });

        return simplePromiseAllSettled(appsToStop.map(app => app.stop()))
            .then(() => {
                // 💡 These applications are not all really stopped, because stop() may ignore
                // starting(e.g. when loading source code or bootstrapping), and stopping can
                // be interrupted by start() or update().
                //
                // But we are sure about that all applications are not be mounted at root DOM,
                // because starting which interrupts this stop() or ignored by this stop() is not at mounting yet.
                this.debug('Apps should be stopped are all stopped(maybe some are interrupted by start).');

                // If this stop() is interrupted, the next starting must be after this "then".
                // If the starting ignored by this stop() exists, it should be interrupted after this "then".
                // Whatever, in this "then" function, DOM is ready.
                return this.hooks.afterrootready.promise({ source });
            })
            .then(() => {
                if (name !== this.#lastAppNameTryingActivate) {
                    this.debug(
                        'The latest app activating is %s, cancel activating app %s.',
                        this.#lastAppNameTryingActivate,
                        name
                    );
                    throw Error(`${this}'s activating ${name} is interrupted by ${this.#lastAppNameTryingActivate}.`);
                }

                if (!appToBeActivated) {
                    if (name) {
                        this.debug('The app %s activating is not found.', name);
                        const err = Error(`${this} cannot find app ${name} to be activated.`);
                        this.#emit('appactivateerror', { appname: name, error: err });
                        throw err;
                    } else {
                        this.debug('All apps are stopped.');

                        const err = Error(`${this} has no app to be activated after ${source}.`);
                        this.#emit('noappactivated', { error: err });

                        // Resolve if no name at all.
                        return Promise.resolve(null);
                    }
                }

                return appToBeActivated.start().then(
                    () => {
                        this.debug('The app %s starts successfully.', name);
                        if (name !== this.#lastAppNameTryingActivate) {
                            this.debug(
                                `But the newest app ${this.#lastAppNameTryingActivate} is activating, don't emit appactivated.`
                            );
                            throw Error(
                                `${this}'s activating ${name} is interrupted by ${this.#lastAppNameTryingActivate}.`
                            );
                        }

                        this.#emit('appactivated', { appname: appToBeActivated.name });
                        return appToBeActivated;
                    },
                    err => {
                        this.debug('The app %s fails to start.', name);

                        if (name === this.#lastAppNameTryingActivate) {
                            this.#emit('appactivateerror', { appname: appToBeActivated.name, error: err });
                        } else {
                            this.debug(
                                "The newest app %s is activating, doesn't emit appactivateerror.",
                                this.#lastAppNameTryingActivate
                            );
                        }

                        throw err;
                    }
                );
            });
    }

    /**
     * Unload all applications, and disable this container forever.
     * @returns Promise<void>
     */
    public destroy(): Promise<void> {
        this.debug('Call destroy().');

        if (this.#destroyPromise) {
            this.debug('Already destroyed or destroying, return directly.');
            return this.#destroyPromise;
        }

        this.#destroying = true;
        this.#emit('destroying', undefined);

        this.#destroyPromise = simplePromiseAllSettled(this.#apps.map(app => app.unload())).then(() => {
            this.debug('All apps are unloaded.');

            this.#appNameRegistry.clear();

            if ('string' !== typeof this.#options.root) {
                this.#domContainerRecord.delete(this.#options.root);
            }

            this.#destroyed = true;
            this.#destroying = false;

            this.#emit('destroyed', undefined);

            this.#eventBus.removeAllListeners();

            // Clear apps after all listeners removed to avoid useless "appregisteredchange".
            this.#appsProxy.splice(0, this.#appsProxy.length);

            this.debug('%s is destroyed.', this);
        });

        return this.#destroyPromise;
    }

    protected throwErrorIfDestroy(): void {
        if (this.isDestroyed || this.isDestroying) {
            throw Error(`${this} is destroying or destroyed.`);
        }
    }

    #emit<T extends keyof ContainerEvent>(event: T, payload: ContainerEvent[T]): void {
        this.debug('Emit %s with %O.', event, payload);
        // Should not break down.
        try {
            this.#eventBus.emit(event, payload);
        } catch {
            //
        }
    }

    get #appsProxy(): App<AppAdditionalOptions, unknown>[] {
        const originApps = this.#apps;
        const debug = this.debug;
        const fn = (): unknown => this.#emit('appregisteredchange', undefined);

        return new Proxy(originApps, {
            get: function (obj, prop: 'push' | 'pop' | 'splice' | 'unshift' | 'shift' | 'sort'): unknown {
                let suspected = false;

                switch (prop) {
                    case 'push':
                    case 'pop':
                    case 'splice':
                    case 'unshift':
                    case 'shift':
                    case 'sort':
                        suspected = true;
                        break;
                    default:
                }

                const originProp = Reflect.get(obj, prop);

                if (suspected && 'function' === typeof originProp) {
                    return function (this: typeof obj, ...args: any[]) {
                        const ret = Reflect.apply(originProp, this, args);
                        debug('App collection is changed by %s method.', prop);
                        fn();
                        return ret;
                    };
                }

                return originProp;
            },
        });
    }
}
