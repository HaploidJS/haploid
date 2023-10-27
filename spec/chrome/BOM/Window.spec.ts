import { WindowNode } from '@/chrome/BOM/Window';
import { delay } from '../../test-utils';

describe.only('Window', () => {
    let win: WindowNode;

    beforeAll(() => {
        // https://github.com/jsdom/jsdom/issues/2740
        Reflect.setPrototypeOf(window, Window.prototype);
    });

    beforeEach(() => {
        win = new WindowNode('test', {}, {});
    });

    afterEach(() => win.onDestroy());

    it('node is an instance of Window', () => {
        expect(win.node.constructor).toStrictEqual(Window);
        expect(win.node).toBeInstanceOf(Window);
    });

    it('window is windowself', () => {
        expect(win.node.window).toStrictEqual<Window>(win.node);
    });

    it('self is windowself and assigning is working', () => {
        expect(win.node.self).toStrictEqual<Window>(win.node);
        Reflect.set(win.node, 'self', null);
        expect(win.node.self).toStrictEqual(null);
    });

    it('top is windowself and assigning is working', () => {
        expect(win.node.top).toStrictEqual(win.node);
        Reflect.set(win.node, 'top', null);
        expect(win.node.top).toStrictEqual(null);
    });

    it('parent is windowself and assigning is working', () => {
        expect(win.node.parent).toStrictEqual(win.node);
        Reflect.set(win.node, 'parent', null);
        expect(win.node.parent).toStrictEqual(null);
    });

    it('location refers to the global one', () => {
        expect(Reflect.get(win.node, 'location')).toStrictEqual<Location>(location);
        win.node.location.hash = 'x';
        expect(location.hash).toStrictEqual<string>('#x');
    });

    describe('localStorage', () => {
        it('setItem/getItem works', () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        localStorage: true,
                    },
                }
            );
            localStorage.setItem('1', 'x');

            win.node.localStorage.setItem('1', '1');
            expect(localStorage.getItem('test:1')).toBe<string>('1');
            expect(win.node.localStorage.length).toBe<number>(1);
            win.node.localStorage.setItem('2', '2');
            expect(win.node.localStorage.length).toBe<number>(2);
            expect(win.node.localStorage.key(1)).toBe<string>('2');
            win.node.localStorage.removeItem('1');
            expect(win.node.localStorage.key(0)).toBe<string>('2');
            expect(win.node.localStorage.length).toBe<number>(1);

            win.node.localStorage.clear();
            expect(win.node.localStorage.length).toBe<number>(0);

            expect(localStorage.length).not.toBe<number>(0);
        });
    });

    describe('setTimeout/clearTimeout', () => {
        it('setTimeout is still running after destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        setTimeout: false,
                    },
                }
            );
            let val = 1;
            win.node.setTimeout(() => {
                val = 6;
            }, 500);

            win.onDestroy();

            await delay(1000);

            expect(val).toBeGreaterThan(1);
        });

        it('setTimeout is auto-cleared when destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        setTimeout: true,
                    },
                }
            );
            let val = 1;
            win.node.setTimeout(() => {
                val = 6;
            }, 500);

            win.onDestroy();

            await delay(1000);

            expect(val).toBe<number>(1); // still 1
        });
    });

    describe('setInterval/clearInterval', () => {
        it('setInterval is still running after destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        setInterval: false,
                    },
                }
            );
            let val = 1;
            win.node.setInterval(() => {
                val++;
            }, 500);

            win.onDestroy();

            await delay(1000);

            expect(val).toBeGreaterThan(1);
        });

        it('setInterval is auto-cleared when destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        setInterval: true,
                    },
                }
            );
            let val = 1;
            win.node.setInterval(() => {
                val++;
            }, 500);

            win.onDestroy();

            await delay(1000);

            expect(val).toBe<number>(1); // still 1
        });
    });

    describe('requestAnimationFrame/cancelAnimationFrame', () => {
        it('requestAnimationFrame is still running after destroyed', async () => {
            let val = 1;
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        requestAnimationFrame: false,
                    },
                }
            );
            win.node.requestAnimationFrame(() => {
                val++;
            });

            win.onDestroy();

            await delay(100);

            expect(val).toBeGreaterThan(1);
        });

        it('requestAnimationFrame is auto-canceled when destroyed', async () => {
            let val = 1;
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        requestAnimationFrame: true,
                    },
                }
            );
            win.node.requestAnimationFrame(() => {
                val++;
            });

            win.onDestroy();

            await delay(100);

            expect(val).toBe<number>(1); // still 1
        });
    });

    describe.skip('requestIdleCallback/cancelIdleCallback', () => {
        let win: WindowNode;
        beforeEach(() => {
            win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        requestIdleCallback: true,
                    },
                }
            );
        });

        it('requestIdleCallback is auto-canceled when destroyed', async () => {
            let val = 1;
            win.node.requestIdleCallback(() => {
                val++;
            });

            win.onDestroy();

            await delay(100);

            expect(val).toBe<number>(1); // still 1
        });
    });

    describe('XMLHttpRequest', () => {
        it('XMLHttpRequest is still running after destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        XMLHttpRequest: false,
                    },
                }
            );
            let returnText = '';
            const xhr = new win.node.XMLHttpRequest();
            const src = `//localhost:10810/chrome/Window/xhr?delay=500&content=text123`;
            xhr.open('GET', src);
            xhr.timeout = 2000;
            xhr.responseType = 'text';
            xhr.onload = (): void => {
                returnText = xhr.responseText;
            };

            xhr.send();

            win.onDestroy();

            await delay(1000);

            expect(returnText).toBe<string>('text123');
        });

        it('XMLHttpRequest is auto-aborted when destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        XMLHttpRequest: true,
                    },
                }
            );

            let returnText = '';
            const xhr = new win.node.XMLHttpRequest();
            const src = `//localhost:10810/chrome/Window/xhr?delay=500&content=text123`;
            xhr.open('GET', src);
            xhr.timeout = 2000;
            xhr.responseType = 'text';
            xhr.onload = (): void => {
                returnText = xhr.responseText;
            };

            xhr.send();

            win.onDestroy();

            await delay(1000);

            expect(xhr.constructor.name).toBe<string>('XMLHttpRequest');

            expect(returnText).toBe<string>(''); // still ''
        });
    });

    describe('fetch', () => {
        it('fetch is still running after destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        fetch: false,
                    },
                }
            );

            let returnText = '';
            const fetch = win.node.fetch;
            expect(fetch.name).toBe('fetch');
            const src = `//localhost:10810/chrome/Window/fetch?delay=500&content=text123`;

            fetch(src)
                .then(res => res.text())
                .then(tx => {
                    returnText = tx;
                })
                .catch(() => {});

            win.onDestroy();

            await delay(1000);

            expect(returnText).toBe('text123');
        });

        it('fetch is auto-aborted when destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        fetch: true,
                    },
                }
            );
            let returnText = '';
            const fetch = win.node.fetch;
            const src = `//localhost:10810/chrome/Window/fetch?delay=500&content=text123`;

            fetch(src)
                .then(res => res.text())
                .then(tx => {
                    returnText = tx;
                })
                .catch(() => {});

            win.onDestroy();

            await delay(1000);

            expect(returnText).toBe('');
        });

        it('fetch cannot be aborted if has signal when destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        fetch: true,
                    },
                }
            );
            let returnText = '';
            const fetch = win.node.fetch;
            const src = `//localhost:10810/chrome/Window/fetch?delay=500&content=text123`;

            fetch(src, {
                signal: new AbortController().signal,
            })
                .then(res => res.text())
                .then(tx => {
                    returnText = tx;
                })
                .catch(() => {});

            win.onDestroy();

            await delay(1000);

            expect(returnText).toBe('text123');
        });
    });

    describe('MutationObserver', () => {
        it('MutationObserver is still running after destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        MutationObserver: false,
                    },
                }
            );
            let newNodeName = '';
            const onObserverd: MutationCallback = (mutations: MutationRecord[]): void => {
                newNodeName = mutations?.[0].addedNodes?.[0].nodeName;
            };

            const observer = new win.node.MutationObserver(onObserverd);

            expect(observer.constructor.name).toBe<string>('MutationObserver');

            observer.observe(win.documentNode.bodyElement, {
                childList: true,
            });

            win.onDestroy();

            win.documentNode.bodyElement.appendChild(win.node.document.createElement('legend'));

            await delay(10);

            expect(newNodeName).toBe<string>('LEGEND');
        });

        it('MutationObserver is auto-disconnected when destroyed', async () => {
            const win = new WindowNode(
                'test',
                {},
                {},
                {
                    patches: {
                        MutationObserver: true,
                    },
                }
            );
            let newNodeName = '';
            const onObserverd: MutationCallback = (mutations: MutationRecord[]): void => {
                newNodeName = mutations?.[0].addedNodes?.[0].nodeName;
            };

            const observer = new win.node.MutationObserver(onObserverd);

            observer.observe(win.documentNode.bodyElement, {
                childList: true,
            });

            win.onDestroy();

            win.documentNode.bodyElement.appendChild(win.node.document.createElement('legend'));

            await delay(10);

            expect(newNodeName).toBe<string>('');
        });
    });

    describe('autoWindowEvents', () => {
        let win: WindowNode;
        beforeEach(() => {
            win = new WindowNode(
                'test',
                {},
                {
                    autoDocumentEvents: ['DOMContentLoaded'],
                },
                {
                    autoWindowEvents: ['load', 'beforeunload'],
                }
            );
        });

        afterEach(() => win.onDestroy());

        it('fire beforeunload', () => {
            const events: Event[] = [];
            let currentTarget: unknown;
            let eventPhase = -1;

            const fn = jest.fn((evt: Event) => {
                events.push(evt);
                eventPhase = evt.eventPhase;
                currentTarget = evt.currentTarget;
            });
            win.node.addEventListener('beforeunload', fn);
            win.onDestroy();
            expect(fn).toHaveBeenCalled();

            expect(currentTarget).toBe(win.node);
            expect(eventPhase).toBe(Event.AT_TARGET);
            expect(events[0].bubbles).toBe(false);
            expect(events[0].cancelable).toBe(true);
            expect(events[0].composed).toBe(false);
            expect(events[0].target).toBe(win.node);
            expect(events[0].srcElement).toBe(win.node);
            expect(events[0].composedPath()).toHaveLength(1);
            expect(events[0].composedPath()[0]).toBe(win.node);
        });

        it('fire DOMContentLoaded', () => {
            const events: Event[] = [];
            const docEvents: Event[] = [];
            let currentTarget: unknown;
            let eventPhase = -1;

            const fn = jest.fn((evt: Event) => {
                events.push(evt);
                eventPhase = evt.eventPhase;
                currentTarget = evt.currentTarget;
            });

            const docfn = jest.fn((evt: Event) => {
                docEvents.push(evt);
            });

            win.node.addEventListener('DOMContentLoaded', fn);
            win.node.document.addEventListener('DOMContentLoaded', docfn);
            win.onLoad();
            expect(fn).toHaveBeenCalled();
            expect(docfn).toHaveBeenCalled();

            expect(currentTarget).toBe(win.node);
            expect(eventPhase).toBe(Event.BUBBLING_PHASE);
            expect(events[0].composed).toBe(false);
            expect(events[0].bubbles).toBe(true);
            expect(events[0].cancelable).toBe(false);
            expect(events[0].target).toBe(win.documentNode.node);
            expect(events[0].srcElement).toBe(win.documentNode.node);
            expect(events[0].composedPath()).toHaveLength(2);
            expect(events[0].composedPath()[0]).toBe(win.node.document);
            expect(events[0].composedPath()[1]).toBe(win.node);

            expect(events[0]).toBe(docEvents[0]);
        });

        it('fire load', () => {
            const events: Event[] = [];
            let currentTarget: unknown;
            let eventPhase = -1;

            let loadEventTime = 0;

            const fn = jest.fn((evt: Event) => {
                loadEventTime = Date.now();
                events.push(evt);
                eventPhase = evt.eventPhase;
                currentTarget = evt.currentTarget;
            });
            let domEventTime = 0;

            const domFn = jest.fn(() => {
                domEventTime = Date.now();
            });

            win.node.addEventListener('load', fn);
            win.node.addEventListener('DOMContentLoaded', domFn);
            win.onLoad();
            expect(fn).toHaveBeenCalled();

            expect(loadEventTime).toBeGreaterThanOrEqual(domEventTime);

            expect(currentTarget).toBe(win.node);
            expect(eventPhase).toBe(Event.AT_TARGET);
            expect(events).toHaveLength(1);
            expect(events[0].bubbles).toBe(false);
            expect(events[0].cancelable).toBe(false);
            expect(events[0].composed).toBe(false);

            // https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event
            expect(events[0].target).toBe(win.node.document);
            expect(events[0].srcElement).toBe(win.node.document);

            expect(events[0].composedPath()).toHaveLength(1);
            expect(events[0].composedPath()[0]).toBe(win.node);
        });
    });
});
