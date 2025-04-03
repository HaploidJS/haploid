import type { WindowOptions, DocumentOptions, WindowShadow, DocumentShadow } from './interfaces';
import { HaploidBeforeUnloadEvent } from './Event';
import { EventNodeProxy } from './EventNodeProxy';
import { DocumentNode } from './Document';
import { LocalStorageNode } from './LocalStorage';
import { nativeWindow } from '../utils';

import { mergeByDescriptor } from '../../utils/mergeByDescriptor';

const presetEscapedKyes = [
    'eval',
    'isFinite',
    'isNaN',
    'parseFloat',
    'parseInt',
    'hasOwnProperty',
    'decodeURI',
    'decodeURIComponent',
    'encodeURI',
    'encodeURIComponent',
];

function patchLocalStorage(obj: Record<string, unknown>, windowOptions: WindowOptions, name: string): void {
    if (!windowOptions.patches?.localStorage) return;

    const ls = new LocalStorageNode(name);

    Reflect.defineProperty(obj, 'localStorage', {
        get(): typeof localStorage {
            return ls.node;
        },
        configurable: true,
        enumerable: true,
    });
}

function patchTimeout(obj: Record<string, unknown>, windowOptions: WindowOptions, timeouts: number[]): void {
    const pushTimeout = (id: number): void => {
        timeouts.push(id);
    };

    const removeTimeout = (id: number): void => {
        const idx = timeouts.findIndex(nid => nid === id);
        if (idx >= 0) {
            timeouts.splice(idx, 1);
        }
    };

    if (windowOptions.patches?.setTimeout) {
        const setTimeoutFn = function (callback: (...args: any[]) => void, ms?: number, ...args: any[]): number {
            const ret = window.setTimeout(callback, ms, ...args);
            pushTimeout(ret);
            return ret;
        };

        const clearTimeoutFn = function (id: number): void {
            clearTimeout(id);
            removeTimeout(id);
        };

        Reflect.defineProperty(obj, 'setTimeout', {
            get() {
                return setTimeoutFn;
            },
            configurable: true,
            enumerable: true,
        });

        Reflect.defineProperty(obj, 'clearTimeout', {
            get() {
                return clearTimeoutFn;
            },
            configurable: true,
            enumerable: true,
        });
    }
}

function patchInterval(obj: Record<string, unknown>, windowOptions: WindowOptions, timeouts: number[]): void {
    const pushTimeout = (id: number): void => {
        timeouts.push(id);
    };

    const removeTimeout = (id: number): void => {
        const idx = timeouts.findIndex(nid => nid === id);
        if (idx >= 0) {
            timeouts.splice(idx, 1);
        }
    };

    if (windowOptions.patches?.setInterval) {
        const setIntervalFn = function (callback: (...args: any[]) => void, ms?: number, ...args: any[]): number {
            const ret = window.setInterval(callback, ms, ...args);
            pushTimeout(ret);
            return ret;
        };

        const clearIntervalFn = function (id: number): void {
            clearInterval(id);
            removeTimeout(id);
        };

        Reflect.defineProperty(obj, 'setInterval', {
            get() {
                return setIntervalFn;
            },
            configurable: true,
            enumerable: true,
        });

        Reflect.defineProperty(obj, 'clearInterval', {
            get() {
                return clearIntervalFn;
            },
            configurable: true,
            enumerable: true,
        });
    }
}

function patchAnimationFrame(obj: Record<string, unknown>, windowOptions: WindowOptions, timeouts: number[]): void {
    const pushTimeout = (id: number): void => {
        timeouts.push(id);
    };

    const removeTimeout = (id: number): void => {
        const idx = timeouts.findIndex(nid => nid === id);
        if (idx >= 0) {
            timeouts.splice(idx, 1);
        }
    };

    if ('function' === typeof requestAnimationFrame && windowOptions.patches?.requestAnimationFrame) {
        const requestAnimationFrameFn = function (callback: FrameRequestCallback): number {
            const ret = requestAnimationFrame(callback);
            pushTimeout(ret);
            return ret;
        };

        const cancelAnimationFrameFn = function (id: number): void {
            cancelAnimationFrame(id);
            removeTimeout(id);
        };

        Reflect.defineProperty(obj, 'requestAnimationFrame', {
            get() {
                return requestAnimationFrameFn;
            },
            configurable: true,
            enumerable: true,
        });

        Reflect.defineProperty(obj, 'cancelAnimationFrame', {
            get() {
                return cancelAnimationFrameFn;
            },
            configurable: true,
            enumerable: true,
        });
    }
}

function patchIdleCallback(obj: Record<string, unknown>, windowOptions: WindowOptions, timeouts: number[]): void {
    const pushTimeout = (id: number): void => {
        timeouts.push(id);
    };

    const removeTimeout = (id: number): void => {
        const idx = timeouts.findIndex(nid => nid === id);
        if (idx >= 0) {
            timeouts.splice(idx, 1);
        }
    };

    if ('function' === typeof requestIdleCallback && windowOptions.patches?.requestIdleCallback) {
        const requestIdleCallbackFn = function (callback: IdleRequestCallback, options?: IdleRequestOptions): number {
            const ret = requestIdleCallback(callback, options);
            pushTimeout(ret);
            return ret;
        };

        const cancelIdleCallbackFn = function (id: number): void {
            cancelIdleCallback(id);
            removeTimeout(id);
        };

        Reflect.defineProperty(obj, 'requestIdleCallback', {
            get() {
                return requestIdleCallbackFn;
            },
            configurable: true,
            enumerable: true,
        });

        Reflect.defineProperty(obj, 'cancelIdleCallback', {
            get() {
                return cancelIdleCallbackFn;
            },
            configurable: true,
            enumerable: true,
        });
    }
}

function patchXHR(obj: Record<string, unknown>, windowOptions: WindowOptions, xhrs: XMLHttpRequest[]): void {
    if (!windowOptions.patches?.XMLHttpRequest) return;

    const pushXHR = (xhr: XMLHttpRequest): void => {
        xhrs.push(xhr);
    };

    const removeXHR = (xhr: XMLHttpRequest): void => {
        const idx = xhrs.findIndex(nid => nid === xhr);
        if (idx >= 0) {
            xhrs.splice(idx, 1);
        }
    };

    class XMLHttpRequestProxy {
        constructor(...args: ConstructorParameters<typeof XMLHttpRequest>) {
            const xhr = new XMLHttpRequest(...args);

            xhr.addEventListener('loadend', () => {
                removeXHR(xhr);
            });

            pushXHR(xhr);
            return xhr;
        }
    }

    Reflect.defineProperty(obj, 'XMLHttpRequest', {
        get() {
            return XMLHttpRequestProxy;
        },
        configurable: true,
        enumerable: true,
    });
}

function patchMutationObserver(
    obj: Record<string, unknown>,
    windowOptions: WindowOptions,
    mos: MutationObserver[]
): void {
    if (!windowOptions.patches?.MutationObserver) return;

    const pushMutationObserver = (mo: MutationObserver): void => {
        mos.push(mo);
    };

    class MutationObserverProxy {
        constructor(...args: ConstructorParameters<typeof MutationObserver>) {
            const mo = new MutationObserver(...args);

            pushMutationObserver(mo);
            return mo;
        }
    }

    Reflect.defineProperty(obj, 'MutationObserver', {
        get() {
            return MutationObserverProxy;
        },
        configurable: true,
        enumerable: true,
    });
}

function patchFetch(
    obj: Record<string, unknown>,
    windowOptions: WindowOptions,
    abortControllers: AbortController[]
): void {
    if ('function' !== typeof AbortController || !windowOptions.patches?.fetch) return;

    const pushAbortController = (ac: AbortController): void => {
        abortControllers.push(ac);
    };

    const removeAbortController = (ac: AbortController): void => {
        const idx = abortControllers.findIndex(nid => nid === ac);
        if (idx >= 0) {
            abortControllers.splice(idx, 1);
        }
    };

    function fetchProxy(input: RequestInfo | URL, init?: RequestInit): ReturnType<typeof fetch> {
        if (!init?.signal) {
            const ac = new AbortController();
            let ret: ReturnType<typeof fetch>;
            if (init) {
                init.signal = ac.signal;
                ret = fetch(input, init);
            } else {
                ret = fetch(input, {
                    signal: ac.signal,
                });
            }
            pushAbortController(ac);

            return ret.then(res => {
                removeAbortController(ac);
                return res;
            });
        }

        return fetch(input, init);
    }

    Reflect.defineProperty(fetchProxy, 'name', {
        value: 'fetch',
        writable: false,
        enumerable: true,
        configurable: true,
    });

    Reflect.defineProperty(obj, 'fetch', {
        get() {
            return fetchProxy;
        },
        configurable: true,
        enumerable: true,
    });
}

export class WindowNode extends EventNodeProxy<Window & typeof globalThis> implements WindowShadow {
    readonly #doc: DocumentNode;

    readonly #options: WindowOptions;

    readonly #timeouts: number[];
    readonly #intervals: number[];
    readonly #frames: number[];
    readonly #idles: number[];
    readonly #xhrs: XMLHttpRequest[];
    readonly #mos: MutationObserver[];
    readonly #abortControllers: AbortController[];

    constructor(
        name: string,
        shadow: Record<PropertyKey, unknown>,
        documentOptions: DocumentOptions = {},
        windowOptions: WindowOptions = {}
    ) {
        const timeouts: number[] = [];
        patchTimeout(shadow, windowOptions, timeouts);

        const intervals: number[] = [];
        patchInterval(shadow, windowOptions, intervals);

        const frames: number[] = [];
        patchAnimationFrame(shadow, windowOptions, frames);

        const idles: number[] = [];
        patchIdleCallback(shadow, windowOptions, idles);

        const xhrs: XMLHttpRequest[] = [];
        patchXHR(shadow, windowOptions, xhrs);

        const mos: MutationObserver[] = [];
        patchMutationObserver(shadow, windowOptions, mos);

        const abortControllers: AbortController[] = [];
        patchFetch(shadow, windowOptions, abortControllers);

        patchLocalStorage(shadow, windowOptions, name);

        super(name, nativeWindow, shadow, {
            escapeEvents: windowOptions.escapeWindowEvents,
            escapeKeys: [...(windowOptions.escapeVariables ?? []), ...presetEscapedKyes],
        });

        this.#options = windowOptions;

        this.#timeouts = timeouts;
        this.#intervals = intervals;
        this.#frames = frames;
        this.#idles = idles;
        this.#xhrs = xhrs;
        this.#mos = mos;
        this.#abortControllers = abortControllers;

        this.#doc = new DocumentNode(name, this.node, documentOptions);
        this.#doc.parentNode = this;
    }

    public get documentShadow(): DocumentShadow {
        return this.documentNode;
    }

    public get documentNode(): DocumentNode {
        return this.#doc;
    }

    // Called at super()
    protected override getBuiltInShadow(): Record<string, unknown> {
        const getNode = (): Window => this.node;
        const getDoc = (): Document => this.#doc.node;
        const debug = this.debug;

        return mergeByDescriptor(
            {
                get window(): Window {
                    return getNode();
                },
                get self(): Window {
                    debug('return this window as self');
                    return getNode();
                },
                get top(): Window | null {
                    if (nativeWindow === nativeWindow.top) {
                        debug('return this window as top');
                        return getNode();
                    }

                    debug('return real top');
                    return nativeWindow.top;
                },
                get parent(): Window {
                    if (nativeWindow === nativeWindow.parent) {
                        debug('return this window as parent');
                        return getNode();
                    }

                    debug('return real parent');
                    return nativeWindow.parent;
                },
                get globalThis(): Window {
                    return getNode();
                },

                get document(): Document {
                    return getDoc();
                },
                /** Native location can only be visited from real window. */
                get location(): Location {
                    return nativeWindow.location;
                },
                set location(x: Location & string) {
                    nativeWindow.location = x;
                },
            },
            super.getBuiltInShadow()
        );
    }

    protected override get debugName(): string {
        return `chrome:Window:${this.name}`;
    }

    public override onLoad(): void {
        this.documentShadow.onLoad();

        if (this.#options.autoWindowEvents?.includes('load')) {
            const getDoc = (): Document => this.node.document;
            const loadEvent = new Event('load', {
                bubbles: false,
                cancelable: false,
            });

            // LoadEvent's target or srcElement is document instead of window.
            // https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
            Reflect.defineProperty(loadEvent, 'target', {
                get() {
                    return getDoc();
                },
                configurable: false,
            });

            Reflect.defineProperty(loadEvent, 'srcElement', {
                get() {
                    return getDoc();
                },
                configurable: false,
            });

            this.dispatchScopedEvent(loadEvent);
        }

        super.onLoad();
    }

    public override onLoading(): void {
        this.documentShadow.onLoading();
        super.onLoading();
    }

    public override onDestroy(): void {
        this.documentShadow.onDestroy();

        if (this.#options.autoWindowEvents?.includes('beforeunload')) {
            this.dispatchScopedEvent(new HaploidBeforeUnloadEvent());
        }

        this.#timeouts.forEach(id => clearTimeout(id));
        this.#timeouts.splice(0, this.#timeouts.length);

        this.#intervals.forEach(id => clearInterval(id));
        this.#intervals.splice(0, this.#intervals.length);

        this.#frames.forEach(id => cancelAnimationFrame(id));
        this.#frames.splice(0, this.#frames.length);

        this.#idles.forEach(id => cancelIdleCallback(id));
        this.#idles.splice(0, this.#idles.length);

        this.#xhrs.forEach(xhr => {
            try {
                xhr.abort();
            } catch {
                // ignore
            }
        });
        this.#xhrs.splice(0, this.#xhrs.length);

        this.#mos.forEach(mo => {
            try {
                mo.disconnect();
            } catch {
                // ignore
            }
        });
        this.#mos.splice(0, this.#mos.length);

        this.#abortControllers.forEach(ac => {
            try {
                ac.abort();
            } catch {
                // ignore
            }
        });
        this.#abortControllers.splice(0, this.#abortControllers.length);

        super.onDestroy();
    }
}
