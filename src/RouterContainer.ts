import { getUniversalRouter, RouterNavigation, RerouteDescriptor, RerouteConsumer, Router } from './Router';
import { ActivityFn, Activity, AppLocation } from './Def';
import { Container } from './Container';
import { App } from './App';

import { sanitizeActiveWhen } from './utils/sanitizeActiveWhen';
import { parseUri } from './utils/navigateToUrl';

export type RouterAppOptions = {
    activeWhen: Activity;
};

export type CancelationRouterNavigation = Readonly<
    Pick<RouterNavigation, 'newUrl' | 'newState' | 'oldUrl' | 'oldState'>
>;

export interface RouterContainerBaseOptions {
    fallbackUrl?: string;
    fallbackOnlyWhen?: ActivityFn;
    cancelActivateApp?: (app: string | undefined, event: CancelationRouterNavigation) => Promise<boolean> | boolean;
    disableAppConflictWarning?: boolean;
}

/**
 * Container that activates or deactivates applications by URL router automatically.
 * You must call run() to start working.
 */
export class RouterContainer<
    ContainerAdditionalOptions = Record<never, never>,
    AppAdditionalOptions = Record<never, never>,
> extends Container<RouterContainerBaseOptions & ContainerAdditionalOptions, RouterAppOptions & AppAdditionalOptions> {
    #running = false;

    readonly #activeWhenMap = new Map<App<RouterAppOptions & AppAdditionalOptions, unknown>, ActivityFn>();

    protected override get debugName(): string {
        return `router-container:${this.options.name}`;
    }

    public override get [Symbol.toStringTag](): string {
        return 'RouterContainer';
    }

    #resolveActiveWhen(app: App<RouterAppOptions & AppAdditionalOptions, unknown>): ActivityFn {
        let fn = this.#activeWhenMap.get(app);
        if (!fn) {
            fn = sanitizeActiveWhen(app.options.activeWhen);
            this.#activeWhenMap.set(app, fn);
        }

        return fn;
    }

    #searchAppByLocation(location: AppLocation): App<RouterAppOptions & AppAdditionalOptions, unknown> | undefined {
        let firstMatched: App<RouterAppOptions & AppAdditionalOptions, unknown> | undefined = undefined;

        for (let i = 0; i < this.appsOtherThanAPI.length; i += 1) {
            const app = this.appsOtherThanAPI[i];

            if (!this.#resolveActiveWhen(app)(location)) {
                continue;
            }

            if (!firstMatched) {
                firstMatched = app;

                // Print a warning if activeWhens in different apps match the same location.
                if (!this.options.disableAppConflictWarning && i < this.appsOtherThanAPI.length - 1) {
                    const otherAppsMatched = this.appsOtherThanAPI
                        .slice(i + 1)
                        .filter(app => this.#resolveActiveWhen(app)(location));
                    if (otherAppsMatched.length) {
                        console.warn(
                            `${app} is matched first in current location(${location.href}), but there ${
                                otherAppsMatched.length > 1 ? 'are' : 'is'
                            } other app(s) matched too, make sure ${
                                otherAppsMatched.length > 1 ? 'these' : 'this'
                            } app(s) can be matched first in other than current location.`,
                            otherAppsMatched.map(app => app.name)
                        );
                    }
                }
                break;
            }
        }

        return firstMatched;
    }

    #lastNoTryingActivatingApp = -1;
    private checkNo = 0;

    private async checkAppActivity(descriptor: RerouteDescriptor): Promise<void> {
        const checkNo = ++this.checkNo;
        const { navigation, cancelOneVoteVeto } = descriptor;
        let cancelNavigation = false;
        let redirectUrl: string | undefined = undefined;

        const urlpath = location.href.replace(location.origin, '');

        this.debug('Call checkAppActivity(%O) under %s, current apps: %O.', descriptor.navigation, urlpath, this.apps);

        // 💡 Make sure NO asynchronous operation before this line.
        const appToBeActivated = this.#searchAppByLocation(window.location);

        if (!appToBeActivated) {
            redirectUrl = this.#getRedirectUrlUnderLocation(window.location);
            this.debug('No app to be activated, get redirect url=%s.', redirectUrl);
        }

        this.debug('Found appToBeActivated=%s by location.', appToBeActivated?.name);

        if ('cancelActivateApp' in this.options) {
            if ('function' !== typeof this.options.cancelActivateApp) {
                console.warn(
                    `The option cancelActivateApp should be a function instead of ${typeof this.options
                        .cancelActivateApp}.`
                );
            } else {
                const eventPassOut = { ...navigation };

                Reflect.deleteProperty(eventPassOut, 'isCanceled');
                Reflect.deleteProperty(eventPassOut, 'event');

                Object.freeze(eventPassOut);

                cancelNavigation = await this.options.cancelActivateApp(appToBeActivated?.name, eventPassOut);
            }
        }

        this.debug('Is %s trying to cancel navigation? %s.', appToBeActivated?.name, cancelNavigation);

        const vetoed = await (cancelNavigation ? cancelOneVoteVeto.veto() : cancelOneVoteVeto.pass(redirectUrl));

        // Being vetoed means this navigation(if exists) is cancelled and has been removed from queue.
        // And its event will never be fired.
        if (vetoed === true) {
            this.debug('%O is vetoed, cancel activating %s.', navigation, appToBeActivated?.name);
            return;
        } else if (vetoed.length === 1) {
            this.debug('Someone wants to redirect to %s, cancel activating %s.', vetoed[0], appToBeActivated?.name);
            return;
        }

        // Check if already skipped.
        if (checkNo < this.#lastNoTryingActivatingApp) {
            this.debug('There must be newer app to be activating, cancel activating %s.', appToBeActivated?.name);
            return;
        }

        this.#lastNoTryingActivatingApp = checkNo;

        this.activateAppByName(appToBeActivated?.name ?? null, descriptor).catch(err => {
            if (appToBeActivated?.name) {
                console.warn(`Reroute to ${appToBeActivated?.name} failed:`, err);
            }
        });
    }

    #consumer: RerouteConsumer = {
        accept: (descriptor: RerouteDescriptor): Promise<unknown> => this.checkAppActivity(descriptor),
    };

    #router: Router | undefined = undefined;

    public get router(): Router | undefined {
        return this.#router;
    }

    /**
     * Destroy this container, after all applications unloaded.
     * @returns Promise<void>
     */
    public override destroy(): Promise<void> {
        if (this.#running) {
            this.#router?.unregisterConsumer(this.#consumer);
            this.#router = undefined;
            this.off('appregisteredchange', this.triggerReroute, this);
        }

        this.#running = false;

        this.#activeWhenMap.clear();

        return super.destroy();
    }

    public get isRunning(): boolean {
        return this.#running;
    }

    /**
     * Make this container starts working.
     * @returns void
     */
    public run(): void {
        this.debug('Call run().');

        this.throwErrorIfDestroy();

        if (this.#running) {
            return;
        }

        this.#running = true;

        this.#router = getUniversalRouter();

        this.#router.registerConsumer(this.#consumer);

        this.on('appregisteredchange', this.triggerReroute, this);

        this.hooks.afterrootready.tapPromise(`${this}`, ({ source }) => {
            return (source as RerouteDescriptor).domReadyCounter.count();
        });

        // Must reoute in macro task.
        setTimeout(() => {
            this.triggerReroute();
        }, 0);
    }

    /**
     * Manually trigger router changed, instead of URL.
     * @returns void
     */
    public triggerReroute(): void {
        this.debug('Call triggerReroute().');
        if (this.#running) {
            this.#router?.reroute();
        }
    }

    #getRedirectUrlUnderLocation(loc: AppLocation): string | undefined {
        const fallbackOnlyWhen = this.options.fallbackOnlyWhen ?? ((): boolean => true);
        const fallbackUrl = this.options.fallbackUrl;

        if ('string' === typeof fallbackUrl && fallbackOnlyWhen(loc)) {
            const fallbackLocation = parseUri(fallbackUrl.trim());

            if (!this.#searchAppByLocation(fallbackLocation)) {
                console.warn(`The fallbackUrl ${this.options.fallbackUrl} doesn't match any application registered.`);
                return;
            }

            return fallbackUrl;
        }

        return;
    }
}
