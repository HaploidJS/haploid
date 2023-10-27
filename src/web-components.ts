import { RouterContainer, RouterAppOptions } from './RouterContainer';
import { ManualContainer } from './ManualContainer';
import type { AppOptions } from './Def';
import { Container } from './Container';
import type { AppAPI } from './App';

import { getAvaliableCustomElementName } from './utils/getAvaliableCustomElementName';

export type ParsedAppOptions = AppOptions<unknown> & Partial<RouterAppOptions>;

export class AppElement extends HTMLElement {
    public getAppOptions(): ParsedAppOptions | null {
        const name = this.getAttribute('name');
        const safe = this.hasAttribute('safe');
        const entry = this.getAttribute('entry');
        const sandbox = this.hasAttribute('sandbox');
        const preload = this.hasAttribute('preload');
        const keepAlive = this.hasAttribute('keep-alive');
        const preserveHTML = this.hasAttribute('preserve-html');
        const activeWhen = this.getAttribute('active-when');
        const ignoreAsset = this.getAttribute('ignore-asset');
        const ignoreUnmountFailure = this.hasAttribute('ignore-unmount-failure');

        if (!name) {
            console.error(this, 'needs a name attribute.');
            return null;
        }

        if (!entry) {
            console.error(this, 'needs an entry attribute.');
            return null;
        }

        const appOptions: ParsedAppOptions = {
            name,
            entry,
            portalElement: this,
        };

        if (sandbox) {
            appOptions.sandbox = sandbox;
        }

        if (keepAlive) {
            appOptions.keepAlive = keepAlive;
        }

        if (preload) {
            appOptions.preload = preload;
        }

        if (safe) {
            appOptions.safe = safe;
        }

        if (ignoreUnmountFailure) {
            appOptions.ignoreUnmountFailure = ignoreUnmountFailure;
        }

        if (this.hasAttribute('title')) {
            appOptions.title = this.getAttribute('title') ?? '';
        }

        if (preserveHTML) {
            appOptions.preserveHTML = true;
        }

        if (this.hasAttribute('preset-body-html')) {
            appOptions.presetBodyHTML = this.getAttribute('preset-body-html') ?? '';
        }

        if (this.hasAttribute('preset-head-html')) {
            appOptions.presetHeadHTML = this.getAttribute('preset-head-html') ?? '';
        }

        if (ignoreAsset) {
            appOptions.ignoreAsset = RegExp(ignoreAsset);
        }

        if (this.hasAttribute('preload-delay')) {
            appOptions.preloadDelay = Number(this.getAttribute('preload-delay'));
        }

        if (this.hasAttribute('max-load-retry-times')) {
            appOptions.maxLoadRetryTimes = Number(this.getAttribute('max-load-retry-times'));
        }

        if (activeWhen) {
            appOptions.activeWhen = activeWhen;
        }
        return appOptions;
    }
}

export class ContainerElement extends HTMLElement {
    #container: Container<unknown, unknown> | null = null;

    constructor() {
        super();
    }

    private static get observedAttributes(): string[] {
        return [
            'current',
            'name',
            'manual',
            'fallback-url',
            'disable-app-conflict-warning',
            'preload',
            'max-load-concurrency',
        ];
    }

    private init(): Container<unknown, unknown> {
        const name = this.getAttribute('name');
        const manual = this.hasAttribute('manual');
        const fallbackUrl = this.getAttribute('fallback-url');
        const disableAppConflictWarning = this.hasAttribute('disable-app-conflict-warning');
        const maxLoadConcurrency = parseInt(this.getAttribute('max-load-concurrency') ?? '', 10);

        const options = {
            name: name ?? 'anonymous',
            root: this,
            disableAppConflictWarning,
        };

        if (fallbackUrl) {
            Reflect.defineProperty(options, 'fallbackUrl', {
                value: fallbackUrl,
                configurable: true,
                enumerable: true,
                writable: true,
            });
        }

        if (!isNaN(maxLoadConcurrency)) {
            Reflect.defineProperty(options, 'maxLoadConcurrency', {
                value: maxLoadConcurrency,
                configurable: true,
                enumerable: true,
                writable: true,
            });
        }

        if (this.hasAttribute('preload')) {
            const preloadAttr = this.getAttribute('preload');

            let preloadVal: undefined | boolean | 'auto';
            switch (preloadAttr) {
                case 'true':
                    preloadVal = true;
                    break;
                case 'false':
                    preloadVal = false;
                    break;
                case 'auto':
                    preloadVal = 'auto';
                    break;
                default:
                    console.warn(preloadAttr, 'is not a valid value for preload attribute');
            }

            if ('undefined' !== typeof preloadVal)
                Reflect.defineProperty(options, 'preload', {
                    value: preloadVal,
                    configurable: true,
                    enumerable: true,
                    writable: true,
                });
        }

        const container = new (manual ? ManualContainer : RouterContainer)(options);

        const fireEvent = (name: string, detail: unknown): void => {
            this.dispatchEvent(
                new CustomEvent(name, {
                    detail,
                })
            );
        };

        container.on('appactivated', ({ appname }) => fireEvent('appactivated', { appname }));
        container.on('appactivateerror', ({ appname, error }) => fireEvent('appactivateerror', { appname, error }));
        container.on('appactivating', ({ appname }) => fireEvent('appactivating', { appname }));
        container.on('appregisteredchange', () => fireEvent('appregisteredchange', {}));
        container.on('appregistererror', ({ error }) => fireEvent('appregistererror', { error }));
        container.on('noappactivated', () => fireEvent('noappactivated', {}));
        container.on('destroyed', () => fireEvent('destroyed', {}));
        container.on('destroying', () => fireEvent('destroying', {}));

        const nodes: AppElement[] = Array.from(this.children).filter(
            (node): node is AppElement => node instanceof AppElement
        );

        for (const node of nodes) {
            const appOptions = node.getAppOptions();

            if (!appOptions) continue;

            let appAPI: AppAPI<unknown, unknown>;

            if (manual) {
                appAPI = (container as ManualContainer).registerApp(appOptions);
            } else {
                if (!appOptions.activeWhen) {
                    console.error(node, 'needs an active-when attribute.');
                    continue;
                }

                appAPI = (container as RouterContainer).registerApp(
                    appOptions as AppOptions<unknown> & RouterAppOptions
                );
            }

            const fireEvent = (name: string, detail: unknown): void => {
                node.dispatchEvent(
                    new CustomEvent(name, {
                        detail,
                    })
                );
            };

            appAPI.on('statechange', ({ prevState, nextState }) => fireEvent('statechange', { prevState, nextState }));
            appAPI.on('beforeload', () => fireEvent('beforeload', {}));
            appAPI.on('afterload', () => fireEvent('afterload', {}));
            appAPI.on('loaderror', err => fireEvent('loaderror', err));
            appAPI.on('beforestart', () => fireEvent('beforestart', {}));
            appAPI.on('afterstart', () => fireEvent('afterstart', {}));
            appAPI.on('starterror', err => fireEvent('starterror', err));
            appAPI.on('beforestop', () => fireEvent('beforestop', {}));
            appAPI.on('afterstop', () => fireEvent('afterstop', {}));
            appAPI.on('stoperror', err => fireEvent('stoperror', err));
            appAPI.on('beforeupdate', () => fireEvent('beforeupdate', {}));
            appAPI.on('afterupdate', () => fireEvent('afterupdate', {}));
            appAPI.on('updateerror', err => fireEvent('updateerror', err));
            appAPI.on('beforeunload', () => fireEvent('beforeunload', {}));
            appAPI.on('afterunload', () => fireEvent('afterunload', {}));
            appAPI.on('unloaderror', err => fireEvent('unloaderror', err));
        }

        return container;
    }

    protected connectedCallback(): void {
        this.#container = this.init();

        if (this.#container instanceof RouterContainer) {
            this.#container.run();
        } else if (this.#container instanceof ManualContainer) {
            this.#container.activateApp(this.getAttribute('current'));
        }
    }

    protected disconnectedCallback(): void {
        this.#container?.destroy();
        this.#container = null;
    }

    protected attributeChangedCallback(name: string, oldValue: string, newValue: string): void {
        if (this.#container) {
            if ('current' === name && this.#container instanceof ManualContainer) {
                this.#container.activateApp(newValue);
            }
            console.warn(
                `Attribute changed of ${name} does not work after this <${this.tagName.toLowerCase()}> has been connected.`
            );
        }
    }
}

type RegisteredCustomElements = { App: string; Container: string };

let savedRegisteredCustomElements: RegisteredCustomElements | null;

export function registerWebComponents(): RegisteredCustomElements {
    if (savedRegisteredCustomElements) return savedRegisteredCustomElements;

    const App = getAvaliableCustomElementName('haploid-app');
    const Container = getAvaliableCustomElementName('haploid-container');
    window.customElements.define(App, AppElement);
    window.customElements.define(Container, ContainerElement);

    return (savedRegisteredCustomElements = { App, Container });
}
