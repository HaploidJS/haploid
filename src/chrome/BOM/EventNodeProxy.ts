import { EventManipulator, patchEventListener } from './patchEventListener';
import { NodeProxy, NodeProxyOptions } from './NodeProxy';

export interface EventNodeProxyOptions extends NodeProxyOptions {
    escapeEvents?: string[];
}

interface EventNode {
    get parentNode(): EventNode | null;
    set parentNode(node: EventNode | null);
    get node(): EventTarget;
    getCapturedListeners(type: string): EventListenerOrEventListenerObject[];
    getBubbleListeners(type: string): EventListenerOrEventListenerObject[];
}

export abstract class EventNodeProxy<T extends EventTarget> extends NodeProxy<T> implements EventNode {
    readonly #escapeEvents: string[];
    readonly #eventObject: EventManipulator;

    constructor(name: string, raw: T, shadow: Record<PropertyKey, unknown>, options: EventNodeProxyOptions = {}) {
        super(name, raw, shadow, options);
        this.#escapeEvents = options.escapeEvents ?? [];

        this.#eventObject = patchEventListener<T>(this.node, raw);
    }

    #parentNode: EventNode | null = null;

    public get parentNode(): EventNode | null {
        return this.#parentNode;
    }

    public set parentNode(node: EventNode | null) {
        this.#parentNode = node;
    }

    public getCapturedListeners(type: string): EventListenerOrEventListenerObject[] {
        return this.#eventObject.queryListeners(type, true);
    }

    public getBubbleListeners(type: string): EventListenerOrEventListenerObject[] {
        return this.#eventObject.queryListeners(type, false);
    }

    protected override getBuiltInShadow(): Record<string, unknown> {
        return {
            addEventListener: (
                type: string,
                callback: EventListenerOrEventListenerObject | null,
                options?: AddEventListenerOptions | boolean
            ) => this.#eventObject.addEventListener.call(this.node, type, callback, options),
            removeEventListener: (
                type: string,
                callback: EventListenerOrEventListenerObject | null,
                options?: EventListenerOptions | boolean
            ) => this.#eventObject.removeEventListener.call(this.node, type, callback, options),
            dispatchEvent: (event: Event): boolean => {
                if (this.#escapeEvents?.includes(event.type)) {
                    this.debug('An escaped event(%s) is dispatched: %o.', event.type, event);
                    return this.raw.dispatchEvent(event);
                }
                return this.dispatchScopedEvent(event);
            },
        };
    }

    public dispatchScopedEvent(event: Event): boolean {
        this.debug('dispatchScopedEvent(%o).', event);
        const paths: EventNode[] = [this];
        let n: EventNode | null = this.parentNode;

        while (n) {
            paths.push(n);
            n = n.parentNode;
        }

        let eventPhase: Event['AT_TARGET'] | Event['BUBBLING_PHASE'] | Event['CAPTURING_PHASE'] | Event['NONE'] =
            Event['NONE'] ?? 0;
        let currentTarget: EventTarget | null = null;
        let propagationStopped = false;
        let immediatePropagationStopped = false;
        let canceled: boolean | undefined = undefined;
        let defaultPreventedCalled = false;

        const decorators: PropertyDescriptorMap = {
            constructor: {
                value: event.constructor,
                enumerable: false,
                configurable: true,
            },
            eventPhase: {
                get: (): number => eventPhase,
                configurable: true,
            },
            composedPath: {
                get: () => (): EventTarget[] => paths.map(path => path.node),
                configurable: true,
            },
            currentTarget: {
                get: (): EventTarget | null => currentTarget,
                configurable: true,
            },
            target: {
                get: (): EventTarget => this.node,
                configurable: true,
            },
            /** deprecated */
            srcElement: {
                get: (): EventTarget => this.node,
                configurable: true,
            },
            /** deprecated */
            cancelBubble: {
                set: (cancel: boolean) => {
                    propagationStopped = cancel;
                },
                get: (): boolean => {
                    return propagationStopped;
                },
                configurable: true,
            },
            stopPropagation: {
                get: () => {
                    return (): void => {
                        propagationStopped = true;
                    };
                },
                configurable: true,
            },
            stopImmediatePropagation: {
                get: () => {
                    return (): void => {
                        immediatePropagationStopped = true;
                        propagationStopped = true;
                    };
                },
                configurable: true,
            },
            preventDefault: {
                get: () => {
                    return (): void => {
                        canceled = true;
                        defaultPreventedCalled = true;
                    };
                },
                configurable: true,
            },
            defaultPrevented: {
                get: () => {
                    return Boolean(canceled);
                },
                configurable: true,
            },
            /** deprecated */
            returnValue: {
                get: () => {
                    return true !== canceled;
                },
                set: (val: boolean) => {
                    canceled = !val;
                },
                configurable: true,
            },
        };

        for (const key in decorators) {
            Reflect.defineProperty(event, key, decorators[key]);
        }

        const thisEvent = event;

        const getRet = (): boolean => event.cancelable && defaultPreventedCalled;

        // The capture phase.
        for (const tnode of paths.slice().reverse()) {
            eventPhase = tnode === this ? Event['AT_TARGET'] : Event['CAPTURING_PHASE'];
            currentTarget = tnode.node;

            for (const lis of tnode.getCapturedListeners(event.type)) {
                if ('function' === typeof lis) lis(thisEvent);
                else lis.handleEvent(thisEvent); // context must be lis
                if (immediatePropagationStopped) break;
            }

            if (propagationStopped) break;
        }

        if (propagationStopped) return getRet(); // Don't bubble

        if (!event.bubbles) {
            // Only dispatch at current
            for (const tnode of [this]) {
                eventPhase = tnode === this ? Event['AT_TARGET'] : Event['BUBBLING_PHASE'];
                currentTarget = tnode.node;

                for (const lis of tnode.getBubbleListeners(event.type)) {
                    if ('function' === typeof lis) lis(thisEvent);
                    else lis.handleEvent(thisEvent); // context must be lis
                    if (immediatePropagationStopped) break;
                }
            }
        } else {
            // The bubble phase.
            for (const tnode of paths) {
                eventPhase = tnode === this ? Event['AT_TARGET'] : Event['BUBBLING_PHASE'];
                currentTarget = tnode.node;

                for (const lis of tnode.getBubbleListeners(event.type)) {
                    if ('function' === typeof lis) lis(thisEvent);
                    else lis.handleEvent(thisEvent); // context must be lis
                    if (immediatePropagationStopped) break;
                }

                if (propagationStopped) break;
            }
        }

        eventPhase = Event['NONE'];
        currentTarget = null;

        return getRet();
    }

    protected override beforeDefineProperty(target: T, p: PropertyKey): void {
        // Remove previous event listener
        if ('string' === typeof p && p.startsWith('on')) {
            const eventKeyWithoutOn = p.slice(2);

            const func = Reflect.get(target, p) as EventListenerOrEventListenerObject | null;

            this.node.removeEventListener(eventKeyWithoutOn, func);
        }
    }

    protected override afterDefineProperty(target: T, p: PropertyKey): void {
        // Add new event listener
        if ('string' === typeof p && p.startsWith('on')) {
            const eventKeyWithoutOn = p.slice(2);

            const func = Reflect.get(target, p) as EventListenerOrEventListenerObject | null;

            if (func) this.node.addEventListener(eventKeyWithoutOn, func);
        }
    }

    protected override beforeDeleteProperty(target: T, p: PropertyKey): void {
        // Remove previous event listener
        if ('string' === typeof p && p.startsWith('on')) {
            const eventKeyWithoutOn = p.slice(2);

            this.node.removeEventListener(
                eventKeyWithoutOn,
                Reflect.get(target, p) as EventListenerOrEventListenerObject
            );
        }
    }

    protected override afterDeleteProperty(/*target: T, p: PropertyKey*/): void {}

    protected override beforeSet(target: T, p: PropertyKey): void {
        // Remove previous event listener
        if ('string' === typeof p && p.startsWith('on')) {
            const eventKeyWithoutOn = p.slice(2);
            const func = Reflect.get(target, p) as EventListenerOrEventListenerObject | null;

            this.node.removeEventListener(eventKeyWithoutOn, func);
        }
    }

    protected override afterSet(target: T, p: PropertyKey): void {
        // Add new event listener
        if ('string' === typeof p && p.startsWith('on')) {
            const eventKeyWithoutOn = p.slice(2);

            const func = Reflect.get(target, p) as EventListenerOrEventListenerObject | null;

            if (func) this.node.addEventListener(eventKeyWithoutOn, func);
        }
    }

    public override onLoad(): void {
        //
    }

    public override onLoading(): void {
        //
    }

    public override onDestroy(): void {
        this.#eventObject.destroy();
    }
}
