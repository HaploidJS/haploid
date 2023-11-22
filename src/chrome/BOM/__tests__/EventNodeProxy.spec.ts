import { EventNodeProxy, EventNodeProxyOptions } from '../EventNodeProxy';

const windowEventKeys = ((): string[] => {
    const keys: string[] = [];
    for (const key in window) {
        if ('string' === typeof key && key.startsWith('on')) {
            keys.push(key);
        }
    }
    return keys;
})();

function $(tag = 'i'): EventTarget {
    return document.createElement(tag);
}

describe.only('EventNodeProxy', () => {
    class TestImpl extends EventNodeProxy<EventTarget> {
        constructor(raw: EventTarget, shadow: Record<PropertyKey, unknown>, options: EventNodeProxyOptions = {}) {
            super('text', raw, shadow, options);
        }

        protected get debugName(): string {
            return 'test:node-proxy';
        }
    }

    let raw: EventTarget;
    let proxy: TestImpl;

    beforeEach(() => {
        raw = $('i');
        proxy = new TestImpl(
            raw,
            {},
            {
                escapeEvents: ['escape-event'],
            }
        );
    });

    afterEach(() => proxy.onDestroy());

    it('getCapturedListeners/getBubbleListeners', () => {
        const blisteners: EventListenerOrEventListenerObject[] = [
            function onXXX(): void {},
            {
                handleEvent(): void {},
            },
        ];

        const clisteners: EventListenerOrEventListenerObject[] = [
            function onXXX(): void {},
            function onYYY(): void {},
            {
                handleEvent(): void {},
            },
        ];

        for (const lis of blisteners) {
            proxy.node.addEventListener('xxx', lis, { capture: false });
        }

        for (const lis of clisteners) {
            proxy.node.addEventListener('xxx', lis, { capture: true });
        }

        expect(proxy.getCapturedListeners('xxx')).toHaveLength(3);
        expect(proxy.getBubbleListeners('xxx')).toHaveLength(2);
    });

    it('addEventListener/removeEventListener work', () => {
        const fn = jest.fn();

        proxy.node.addEventListener('custom-event', fn);

        proxy.node.dispatchEvent(new CustomEvent('custom-event'));

        proxy.node.removeEventListener('custom-event', fn);

        proxy.node.dispatchEvent(new CustomEvent('custom-event'));

        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('escapeEvents works', () => {
        const escapeFn = jest.fn();
        const unescapeFn = jest.fn();

        proxy.raw.addEventListener('escape-event', escapeFn);
        proxy.raw.addEventListener('unescape-event', unescapeFn);

        proxy.node.dispatchEvent(new CustomEvent('escape-event'));
        proxy.node.dispatchEvent(new CustomEvent('unescape-event'));

        expect(escapeFn).toHaveBeenCalledTimes(1); // escaped
        expect(unescapeFn).toHaveBeenCalledTimes(0); // unescaped
    });

    for (const eventKey of windowEventKeys) {
        it(`convert ${eventKey} to addEventListener`, () => {
            const eventKeyWithoutOn = eventKey.slice(2);
            const fn = jest.fn();

            Reflect.set(proxy.node, eventKey, fn);

            proxy.node.dispatchEvent(new CustomEvent(eventKeyWithoutOn));

            const fn1 = jest.fn();

            // should replace previous
            Reflect.set(proxy.node, eventKey, fn1);

            proxy.node.dispatchEvent(new CustomEvent(eventKeyWithoutOn));

            proxy.onDestroy();
            // should not work after destroyed
            proxy.node.dispatchEvent(new CustomEvent(eventKeyWithoutOn));

            expect(fn).toHaveBeenCalledTimes(1);
            expect(fn1).toHaveBeenCalledTimes(1);

            proxy.onDestroy();
        });
    }

    describe('dispatchScopedEvent', () => {
        it('same event object', () => {
            const proxy = new TestImpl($(), {});
            let evt: Event = new Event('bar');
            proxy.node.addEventListener('fooevent', (e: Event) => {
                evt = e;
            });

            const newEvt = new Event('fooevent', {
                cancelable: true,
                bubbles: true,
            });

            proxy.dispatchScopedEvent(newEvt);

            expect(newEvt).toBe(evt);
            expect(newEvt.constructor).toBe(Event);
            expect(newEvt.type).toBe('fooevent');
            expect(newEvt.composed).toBe(false);
            expect(newEvt.cancelable).toBe(true);
            expect(newEvt.bubbles).toBe(true);
            expect(newEvt.isTrusted).toBe(false);
            expect(newEvt.target).toBe(proxy.node);

            proxy.onDestroy();
        });

        it('eventPhase/currentTarget/composedPath/target', () => {
            const parent = new TestImpl($(), {});
            const son = new TestImpl($(), {});
            son.parentNode = parent;

            const eventPhaseResult: number[] = [];
            const currentTargetResult: (EventTarget | null)[] = [];

            parent.node.addEventListener('fooevent', evt => {
                eventPhaseResult.push(evt.eventPhase);
                currentTargetResult.push(evt.currentTarget);
            });
            parent.node.addEventListener(
                'fooevent',
                evt => {
                    eventPhaseResult.push(evt.eventPhase);
                    currentTargetResult.push(evt.currentTarget);
                },
                { capture: true }
            );

            son.node.addEventListener('fooevent', evt => {
                eventPhaseResult.push(evt.eventPhase);
                currentTargetResult.push(evt.currentTarget);
            });
            son.node.addEventListener(
                'fooevent',
                evt => {
                    eventPhaseResult.push(evt.eventPhase);
                    currentTargetResult.push(evt.currentTarget);
                },
                { capture: true }
            );

            const event = new Event('fooevent', {
                bubbles: true,
            });

            son.dispatchScopedEvent(event);

            expect(eventPhaseResult).toEqual<number[]>([
                Event.CAPTURING_PHASE,
                Event.AT_TARGET,
                Event.AT_TARGET,
                Event.BUBBLING_PHASE,
            ]);
            expect(currentTargetResult).toEqual<Array<EventTarget | null>>([
                parent.node,
                son.node,
                son.node,
                parent.node,
            ]);
            expect(currentTargetResult).toEqual<Array<EventTarget | null>>([
                parent.node,
                son.node,
                son.node,
                parent.node,
            ]);

            expect(event.target).toBe<EventTarget>(son.node);
            expect(event.srcElement).toBe<EventTarget>(son.node);
            expect(event.eventPhase).toBe<number>(Event.NONE);
            expect(event.currentTarget).toBeNull();
            expect(event.composedPath()).toEqual<EventTarget[]>([son.node, parent.node]);
        });

        it('stopPropagation when capturing', () => {
            const grand = new TestImpl($(), {});
            const parent = new TestImpl($(), {});
            const son = new TestImpl($(), {});
            son.parentNode = parent;
            parent.parentNode = grand;

            parent.node.addEventListener(
                'fooevent',
                evt => {
                    evt.stopPropagation();
                },
                { capture: true }
            );

            const grandFnCapture = jest.fn();
            const grandFnBubble = jest.fn();
            const sonFnCapture = jest.fn();
            const sonFnBubble = jest.fn();
            const parentFnCapture = jest.fn();

            grand.node.addEventListener('fooevent', grandFnCapture, true);
            grand.node.addEventListener('fooevent', grandFnBubble);
            son.node.addEventListener('fooevent', sonFnCapture, true);
            son.node.addEventListener('fooevent', sonFnBubble);
            parent.node.addEventListener('fooevent', parentFnCapture, true);

            son.dispatchScopedEvent(new Event('fooevent', { bubbles: true }));

            expect(grandFnCapture).toHaveBeenCalled();
            expect(grandFnBubble).not.toHaveBeenCalled();
            expect(sonFnCapture).not.toHaveBeenCalled();
            expect(sonFnBubble).not.toHaveBeenCalled();
            expect(parentFnCapture).toHaveBeenCalled();
        });

        it('stopPropagation when bubbling', () => {
            const grand = new TestImpl($(), {});
            const parent = new TestImpl($(), {});
            const son = new TestImpl($(), {});
            son.parentNode = parent;
            parent.parentNode = grand;

            parent.node.addEventListener('fooevent', evt => {
                evt.stopPropagation();
            });

            const grandFnCapture = jest.fn();
            const grandFnBubble = jest.fn();
            const sonFnCapture = jest.fn();
            const sonFnBubble = jest.fn();
            const parentFnBubble = jest.fn();

            grand.node.addEventListener('fooevent', grandFnCapture, true);
            grand.node.addEventListener('fooevent', grandFnBubble);
            son.node.addEventListener('fooevent', sonFnCapture, true);
            son.node.addEventListener('fooevent', sonFnBubble);
            parent.node.addEventListener('fooevent', parentFnBubble);

            son.dispatchScopedEvent(new Event('fooevent', { bubbles: true }));

            expect(grandFnCapture).toHaveBeenCalled();
            expect(grandFnBubble).not.toHaveBeenCalled();
            expect(sonFnCapture).toHaveBeenCalled();
            expect(sonFnBubble).toHaveBeenCalled();
            expect(parentFnBubble).toHaveBeenCalled();
        });

        it('cancelBubble when capturing', () => {
            const grand = new TestImpl($(), {});
            const parent = new TestImpl($(), {});
            const son = new TestImpl($(), {});
            son.parentNode = parent;
            parent.parentNode = grand;

            parent.node.addEventListener(
                'fooevent',
                evt => {
                    evt.cancelBubble = true;
                },
                { capture: true }
            );

            const grandFnCapture = jest.fn();
            const grandFnBubble = jest.fn();
            const sonFnCapture = jest.fn();
            const sonFnBubble = jest.fn();
            const parentFnCapture = jest.fn();

            grand.node.addEventListener('fooevent', grandFnCapture, true);
            grand.node.addEventListener('fooevent', grandFnBubble);
            son.node.addEventListener('fooevent', sonFnCapture, true);
            son.node.addEventListener('fooevent', sonFnBubble);
            parent.node.addEventListener('fooevent', parentFnCapture, true);

            son.dispatchScopedEvent(new Event('fooevent', { bubbles: true }));

            expect(grandFnCapture).toHaveBeenCalled();
            expect(grandFnBubble).not.toHaveBeenCalled();
            expect(sonFnCapture).not.toHaveBeenCalled();
            expect(sonFnBubble).not.toHaveBeenCalled();
            expect(parentFnCapture).toHaveBeenCalled();
        });

        it('cancelBubble when bubbling', () => {
            const grand = new TestImpl($(), {});
            const parent = new TestImpl($(), {});
            const son = new TestImpl($(), {});
            son.parentNode = parent;
            parent.parentNode = grand;

            parent.node.addEventListener('fooevent', evt => {
                evt.cancelBubble = true;
            });

            const grandFnCapture = jest.fn();
            const grandFnBubble = jest.fn();
            const sonFnCapture = jest.fn();
            const sonFnBubble = jest.fn();
            const parentFnBubble = jest.fn();

            grand.node.addEventListener('fooevent', grandFnCapture, true);
            grand.node.addEventListener('fooevent', grandFnBubble);
            son.node.addEventListener('fooevent', sonFnCapture, true);
            son.node.addEventListener('fooevent', sonFnBubble);
            parent.node.addEventListener('fooevent', parentFnBubble);

            son.dispatchScopedEvent(new Event('fooevent', { bubbles: true }));

            expect(grandFnCapture).toHaveBeenCalled();
            expect(grandFnBubble).not.toHaveBeenCalled();
            expect(sonFnCapture).toHaveBeenCalled();
            expect(sonFnBubble).toHaveBeenCalled();
            expect(parentFnBubble).toHaveBeenCalled();
        });

        it('stopImmediatePropagation when capturing', () => {
            const grand = new TestImpl($(), {});
            const parent = new TestImpl($(), {});
            const son = new TestImpl($(), {});
            son.parentNode = parent;
            parent.parentNode = grand;

            parent.node.addEventListener(
                'fooevent',
                evt => {
                    evt.stopImmediatePropagation();
                },
                { capture: true }
            );

            const grandFnCapture = jest.fn();
            const grandFnBubble = jest.fn();
            const sonFnCapture = jest.fn();
            const sonFnBubble = jest.fn();
            const parentFnCapture = jest.fn();

            grand.node.addEventListener('fooevent', grandFnCapture, true);
            grand.node.addEventListener('fooevent', grandFnBubble);
            son.node.addEventListener('fooevent', sonFnCapture, true);
            son.node.addEventListener('fooevent', sonFnBubble);
            parent.node.addEventListener('fooevent', parentFnCapture, true);

            son.dispatchScopedEvent(new Event('fooevent', { bubbles: true }));

            expect(grandFnCapture).toHaveBeenCalled();
            expect(grandFnBubble).not.toHaveBeenCalled();
            expect(sonFnCapture).not.toHaveBeenCalled();
            expect(sonFnBubble).not.toHaveBeenCalled();
            expect(parentFnCapture).not.toHaveBeenCalled();
        });

        it('stopImmediatePropagation when bubbling', () => {
            const grand = new TestImpl($(), {});
            const parent = new TestImpl($(), {});
            const son = new TestImpl($(), {});
            son.parentNode = parent;
            parent.parentNode = grand;

            parent.node.addEventListener('fooevent', evt => {
                evt.stopImmediatePropagation();
            });

            const grandFnCapture = jest.fn();
            const grandFnBubble = jest.fn();
            const sonFnCapture = jest.fn();
            const sonFnBubble = jest.fn();
            const parentFnBubble = jest.fn();

            grand.node.addEventListener('fooevent', grandFnCapture, true);
            grand.node.addEventListener('fooevent', grandFnBubble);
            son.node.addEventListener('fooevent', sonFnCapture, true);
            son.node.addEventListener('fooevent', sonFnBubble);
            parent.node.addEventListener('fooevent', parentFnBubble);

            son.dispatchScopedEvent(new Event('fooevent', { bubbles: true }));

            expect(grandFnCapture).toHaveBeenCalled();
            expect(grandFnBubble).not.toHaveBeenCalled();
            expect(sonFnCapture).toHaveBeenCalled();
            expect(sonFnBubble).toHaveBeenCalled();
            expect(parentFnBubble).not.toHaveBeenCalled();
        });

        it('preventDefault/defaultPrevented', () => {
            const proxy = new TestImpl($(), {});

            proxy.node.addEventListener('fooevent', evt => {
                evt.preventDefault();
            });

            const event = new Event('fooevent', {
                cancelable: true, // Must be cancelable
            });
            const ret = proxy.dispatchScopedEvent(event);

            expect(ret).toBe<boolean>(true);
            expect(event.returnValue).toBe<boolean>(false);
            expect(event.defaultPrevented).toBe<boolean>(true);
        });

        it('returnValue/defaultPrevented', () => {
            const proxy = new TestImpl($(), {});

            proxy.node.addEventListener('fooevent', evt => {
                // @ts-ignore test
                evt.returnValue = false;
            });

            const event = new Event('fooevent', {
                cancelable: true, // Must be cancelable
            });
            const ret = proxy.dispatchScopedEvent(event);

            expect(ret).toBe<boolean>(false); // Only preventDefault make it true
            expect(event.defaultPrevented).toBe<boolean>(true);
            expect(event.returnValue).toBe<boolean>(false);
        });

        it('compatible with document.createEvent', () => {
            const proxy = new TestImpl($(), {});
            const fn = jest.fn();
            proxy.node.addEventListener('fooevent', fn);

            const event = document.createEvent('ErrorEvent');
            event.initEvent('fooevent', true, true);
            proxy.dispatchScopedEvent(event);

            expect(fn).toHaveBeenCalled();
            expect((event as ErrorEvent).lineno).toBe(0);
        });
    });
});
