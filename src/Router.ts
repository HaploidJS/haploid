import EventEmitter from 'eventemitter3';

import { __HAPLOID_ROUTER__, HAPLOID_ROUTER_VERSION, UNDER_TEST } from './constant';

import { OneVoteVeto, OneVoteVetoController } from './utils/OneVoteVeto';
import { ProtectedEventEmitter } from './utils/ProtectedEventEmitter';
import { createUniversalFactory } from './utils/createUniversalFactory';
import { Counter, CounterController } from './utils/Counter';
import { MinesweeperQueue } from './MinesweeperQueue';
import { DeadLoopDetector } from './utils/DeadLoopDetector';
import { navigateToUrl } from './utils/navigateToUrl';
import { Debugger } from './utils/Debugger';

type HistoryPushOrReplace = typeof history.pushState | typeof history.replaceState;

interface CancelableEventRecord {
    event: HashChangeEvent | PopStateEvent;
    isCanceled?: boolean;
}

export interface RouterNavigation extends Partial<CancelableEventRecord> {
    newUrl: string;
    newState: unknown;
    oldUrl: string;
    oldState: unknown;
}

export type RerouteConsumer = {
    accept(descriptor: RerouteDescriptor): Promise<unknown>;
};

export class RerouteDescriptor {
    public navigation: RouterNavigation;
    public cancelOneVoteVeto: OneVoteVetoController<string>;
    public domReadyCounter: CounterController;

    constructor(
        navigation: RouterNavigation,
        cancelOneVoteVeto: OneVoteVetoController<string>,
        domReadyCounter: CounterController
    ) {
        this.navigation = navigation;
        this.cancelOneVoteVeto = cancelOneVoteVeto;
        this.domReadyCounter = domReadyCounter;
    }

    public toString(): string {
        return `router(${this.navigation.newUrl})`;
    }
}

const originalReplaceState = window.history.replaceState;
const originalPushState = window.history.pushState;
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;

type RouteEventName = 'popstate' | 'hashchange';

const routingEventsListeningTo: RouteEventName[] = ['popstate', 'hashchange'];

export interface RouterEvent {
    deadloopdetect: void;
}

class Router extends Debugger implements ProtectedEventEmitter<RouterEvent> {
    static #instance: Router;

    public readonly originalReplaceState = originalReplaceState;
    public readonly originalPushState = originalPushState;
    public readonly originalAddEventListener = originalAddEventListener;
    public readonly originalRemoveEventListener = originalRemoveEventListener;

    readonly #eventBus = new EventEmitter<keyof RouterEvent>();

    readonly #rerouteConsumers: RerouteConsumer[] = [];

    readonly #deadLoopDetector = new DeadLoopDetector<string>();

    // A history queue that trying to maintain less records.
    // In most cases, it only contain one record, which is confirmed to be not cancelled.
    readonly #historyQ = new MinesweeperQueue<RouterNavigation>([
        {
            newUrl: window.location.href,
            newState: window.history.state,
            oldUrl: window.location.href,
            oldState: window.history.state,
            isCanceled: false,
        },
    ]);

    readonly #eventSequence: CancelableEventRecord[] = [];

    readonly #capturedEventListeners: Record<RouteEventName, Array<EventListener>> = {
        hashchange: [],
        popstate: [],
    };

    private constructor() {
        super();
        /* istanbul ignore if: difficult to enter */
        if (Router.#instance) {
            throw Error('Create router only once.');
        }

        this.#setup();
    }

    public on<T extends keyof RouterEvent>(
        event: T,
        listener: (event: RouterEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.on(event, listener, context);
        return this;
    }

    public once<T extends keyof RouterEvent>(
        event: T,
        listener: (event: RouterEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.once(event, listener, context);
        return this;
    }

    public off<T extends keyof RouterEvent>(
        event: T,
        listener: (event: RouterEvent[T]) => unknown,
        context?: unknown
    ): this {
        this.#eventBus.off(event, listener, context);
        return this;
    }

    public get [Symbol.toStringTag](): string {
        return 'Router';
    }

    protected get debugName(): string {
        return 'router';
    }

    public get version(): number {
        return HAPLOID_ROUTER_VERSION;
    }

    /**
     * Get the only router instance.
     * @returns The only router instance.
     */
    public static getInstance(): Router {
        if (!Router.#instance) {
            Router.#instance = new Router();
        }

        return Router.#instance;
    }

    /**
     * Register a RerouteConsumer instance.
     * @param consumer The RerouteConsumer instance to be registered.
     * @returns If registered successfully.
     */
    public registerConsumer(consumer: RerouteConsumer): boolean {
        this.debug('Call registerConsumer(%O).', consumer);

        /* istanbul ignore if: unnecessary */
        if (this.#rerouteConsumers.includes(consumer)) {
            return false;
        }

        this.#rerouteConsumers.push(consumer);

        return true;
    }

    /**
     * Unregister a RerouteConsumer instance.
     * @param consumer The RerouteConsumer instance to be unregistered.
     * @returns If unregistered successfully.
     */
    public unregisterConsumer(consumer: RerouteConsumer): boolean {
        this.debug('Call unregisterConsumer(%O).', consumer);

        const idx = this.#rerouteConsumers.indexOf(consumer);
        /* istanbul ignore if: difficult to enter */
        if (idx === -1) {
            return false;
        }

        this.#rerouteConsumers.splice(idx, 1);

        return true;
    }

    public reroute(routerNavigation?: RouterNavigation): void {
        this.debug('reroute(%O).', routerNavigation);
        const navigation: RouterNavigation = routerNavigation || {
            // Not a real navigation.
            // It cannot be cancelled because it's not in #historyQ.
            oldState: this.#historyQ.top.newState,
            oldUrl: this.#historyQ.top.newUrl,
            newState: this.#historyQ.top.newState,
            newUrl: this.#historyQ.top.newUrl,
        };

        const consumersLen = this.#rerouteConsumers.length;

        const cancelOneVoteVeto = new OneVoteVeto<string>(consumersLen);
        const domReadyCounter = new Counter(consumersLen);

        this.#rerouteConsumers.forEach(consumer => {
            const cancelOneVoteVetoController = cancelOneVoteVeto.getNextController();
            const domReadyCounterController = domReadyCounter.getNextController();

            // Trying to be voted, but cannot be sure.
            Promise.resolve(
                consumer.accept(
                    new RerouteDescriptor(navigation, cancelOneVoteVetoController, domReadyCounterController)
                )
            ).then(
                () => {
                    cancelOneVoteVetoController.pass();
                },
                err => {
                    this.debug('Encounter consumer error %O.', err);
                    cancelOneVoteVetoController.pass();
                    domReadyCounterController.count();
                }
            );
        });

        // Veto from any consumer makes this navigation cancelled.
        cancelOneVoteVeto.isFinalVetoed().then(vetoed => {
            const idx = this.#eventSequence.findIndex(e => e.event === navigation.event);
            if (vetoed === true) {
                this.#cancelNavigation(navigation);
                if (idx >= 0) {
                    this.debug('Remove a vetoed event %O.', navigation.event);
                    this.#eventSequence.splice(idx, 1); // This is not necessary, the cancelled events will not be fired anyway.
                }
            } else {
                this.#confirmNavigation(navigation);
                if (idx >= 0) {
                    this.#eventSequence[idx].isCanceled = false;
                }

                const redirectUrls = vetoed;

                if (redirectUrls.length > 1) {
                    console.warn('Multiple redirectUrls in conflict:', redirectUrls);
                } else if (redirectUrls.length === 1) {
                    this.debug('Execute redirecting to %s.', redirectUrls[0]);
                    navigateToUrl(redirectUrls[0]);
                }
            }
        });

        // DOM ready must come after all voted.
        domReadyCounter.whenReached().then(() => {
            if (navigation.event) {
                this.#fireDelayedEventsUntil(navigation.event);
            }
        });
    }

    /**
     * Call the original(before patched) history.replace.
     * @param args Same parameters as history.replace.
     * @returns void
     */
    public originalReplace(...args: Parameters<typeof originalReplaceState>): ReturnType<typeof originalReplaceState> {
        return originalReplaceState.call(window.history, ...args);
    }

    /**
     * Call the original(before patched) history.push.
     * @param args Same parameters as history.push.
     * @returns void
     */
    public originalPush(...args: Parameters<typeof originalPushState>): ReturnType<typeof originalPushState> {
        return originalPushState.call(window.history, ...args);
    }

    #cancelNavigation(navigation: RouterNavigation): void {
        if (!this.#historyQ.cancelElement(navigation)) {
            this.debug(
                'Cannot cancelNavigation(%O), it may not exist in queue or not at the top of queue.',
                navigation
            );
            return;
        }

        this.debug('Reroute back to %s.', this.#historyQ.top.newUrl);

        // Do NOT use history.back() cause it will make history.go() avaliable,
        // which does not match the meaning of cancalation.
        // This doesn't not trigger popstate event.
        this.originalReplace(
            this.#historyQ.top.newState,
            '',
            this.#historyQ.top.newUrl.substring(location.origin.length)
        );

        /* istanbul ignore if: do not enter under TEST */
        if (!UNDER_TEST) {
            // It's not so necessary, just in case.
            navigation.newUrl = location.href;
        }

        // Calling reroute with no parameter is always safe, the result could be one of the followings:
        // (1) cancelled, leading to noop(it doesn't affect history queue)
        // (2) approved, leading to noop(app that should be activated is already activated)
        this.reroute();
    }

    #confirmNavigation(navigation: RouterNavigation): void {
        this.#historyQ.confirmElement(navigation);
    }

    #setup(): void {
        // 💡 Notice that assigning to location.hash will also fire a "popstate" event.
        const onPopStateOrHashChange = (event: HashChangeEvent | PopStateEvent): void => {
            this.debug('Captured onPopStateOrHashChange(%O)', event);

            const oldUrl = this.#historyQ.top.newUrl;
            const oldState = this.#historyQ.top.newState;
            const newUrl = window.location.href;
            const newState = window.history.state;

            // This prevents from firing duplicated events.
            if (newUrl === oldUrl && newState === oldState && event.type === this.#historyQ.top.event?.type) {
                this.debug(
                    'Url(%s) and state(%O) are duplicated between two %s events, ignore it.',
                    newUrl,
                    newState,
                    event.type
                );
                return;
            }

            const navigation: RouterNavigation = {
                newUrl,
                newState,
                oldUrl,
                oldState,
                event,
            };

            // A new navigation is pushed, but it may be cancelled later.
            this.#historyQ.add(navigation);

            this.debug('Received new url(%s) or state(%O).', newUrl, newState);

            // Some events may be cancelled later.
            this.#eventSequence.push({
                event,
            });

            this.reroute(navigation);
        };

        // respect to single-spa
        const patchedUpdateState = (updateState: HistoryPushOrReplace, name: string): HistoryPushOrReplace => {
            const debug = this.debug;
            const emit = this.#emit.bind(this);
            const smellsLikeDead = this.#deadLoopDetector.smellsLikeDead.bind(this.#deadLoopDetector);
            return function (
                this: History,
                ...args: Parameters<HistoryPushOrReplace>
            ): ReturnType<HistoryPushOrReplace> {
                const urlBefore = window.location.href;
                const result = updateState.apply(this, args);
                const urlAfter = window.location.href;
                const stateAfter = window.history.state;

                debug('Detected a %s(%s) under %s, result in %s.', name, args[2], urlBefore, urlAfter);

                if (window.__HAPLOID_DISABLE_DEADLOOP_DETECT__ !== true && smellsLikeDead(urlAfter)) {
                    console.warn(
                        `❗️❗️❗️ A dead loop detected, this ${name}(${stateAfter}, '', '${urlAfter}') is abandoned.`
                    );
                    emit('deadloopdetect', undefined);
                    return;
                }

                if (urlBefore !== urlAfter) {
                    debug('Dispatch a popstate.');
                    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
                } else {
                    debug('Ignore this %s due to duplicated url %s.', name, urlAfter);
                }

                return result;
            };
        };

        window.addEventListener('popstate', onPopStateOrHashChange);
        window.addEventListener('hashchange', onPopStateOrHashChange);

        const capturedEventListeners = this.#capturedEventListeners;

        window.addEventListener = function (
            ...args: Parameters<typeof window.addEventListener>
        ): ReturnType<typeof window.addEventListener> {
            const [eventName, fn] = args;
            if (typeof fn === 'function') {
                if (
                    routingEventsListeningTo.includes(eventName as RouteEventName) &&
                    !capturedEventListeners[eventName as RouteEventName].find(listener => listener === fn)
                ) {
                    capturedEventListeners[eventName as RouteEventName].push(fn);
                    return;
                }
            }

            return originalAddEventListener.apply(this, args);
        };

        window.removeEventListener = function (
            ...args: Parameters<typeof window.removeEventListener>
        ): ReturnType<typeof window.removeEventListener> {
            const [eventName, fn] = args;
            if (typeof fn === 'function') {
                if (routingEventsListeningTo.includes(eventName as RouteEventName)) {
                    capturedEventListeners[eventName as RouteEventName] = capturedEventListeners[
                        eventName as RouteEventName
                    ].filter(listener => listener !== fn);
                    return;
                }
            }

            return originalRemoveEventListener.apply(this, args);
        };

        window.history.pushState = patchedUpdateState(originalPushState, 'history.pushState');
        window.history.replaceState = patchedUpdateState(originalReplaceState, 'history.replaceState');
    }

    /**
     * Fire all delayed routing events queued until the specified one,
     * which just triggered a DOM ready point.
     *
     * Worth mentioning is only the approved(not cancelled) ones will be fired,
     * but some are still in asynchronous cancelation, may be cancelled or approved
     * later, so we can be sure that the event parameter specifies will be fired, but
     * not the ones before. This strategy may be challenged in the future.
     * @param event Event before(and) this event will be fired immediately expect the uncanceled ones.
     * @returns void
     */
    #fireDelayedEventsUntil(event: HashChangeEvent | PopStateEvent): void {
        const idx = this.#eventSequence.findIndex(e => e.event === event);

        // Should not happen, just in case.
        if (idx === -1) {
            console.warn(`Try to fire a delayed ${event.type} event not queued, this should not happen.`);
            return;
        }

        if (this.#eventSequence[idx].isCanceled !== false) {
            console.warn('Cannot fire a delayed event which is not approved, this should not happen.', event);
            return;
        }

        let eventsToBeFired = this.#eventSequence.splice(0, idx + 1);
        this.debug('Events before this one are %O, now remove the ones isCanceled !== false .', eventsToBeFired);
        eventsToBeFired = eventsToBeFired.filter(event => event.isCanceled === false);
        this.debug('Fire delayed events from head to %d: %O.', idx, eventsToBeFired);

        for (const { event } of eventsToBeFired) {
            const eventType = event.type as RouteEventName;
            for (const listener of this.#capturedEventListeners[eventType]) {
                // Do not break down.
                try {
                    listener(event);
                } catch {
                    // ignore
                }
            }
        }
    }

    #emit<T extends keyof RouterEvent>(event: T, payload: RouterEvent[T]): void {
        this.debug('Emit %s with %O.', event, payload);
        // Should not break down.
        try {
            this.#eventBus.emit(event, payload);
        } catch {
            //
        }
    }
}

export type { Router };

export const getUniversalRouter = createUniversalFactory<Router>(
    __HAPLOID_ROUTER__,
    () => Router.getInstance(),
    HAPLOID_ROUTER_VERSION,
    // Sorry, conflict is never allowed for router.
    false
);
