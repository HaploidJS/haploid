import { RouterContainer, navigateToUrl } from '../../index';
import { parseUri } from '../../utils/navigateToUrl';
import { RouterNavigation, getUniversalRouter } from '../../Router';
import { delay } from '../../../spec/test-utils';

type LocalRouterNavigation = Omit<RouterNavigation, 'isCanceled'>;

describe.only(`cancel-cancelled`, () => {
    let container: RouterContainer;

    beforeEach(() => {
        navigateToUrl('/');
        return delay(10);
    });

    afterEach(() => container?.destroy());

    it(`delay cancel is cancelled`, async () => {
        let rerouteEvent: LocalRouterNavigation | undefined;
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app, evt: LocalRouterNavigation): Promise<boolean> => {
                rerouteEvent = evt;
                if (app === 'bar') {
                    return delay(100).then(() => true);
                }

                return Promise.resolve(false);
            },
            fallbackUrl: '/foo',
        });

        container.registerApps([
            {
                name: 'foo',
                activeWhen: '/foo',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
        ]);

        container.run();

        await delay(10);

        expect(location.pathname).toBe('/foo'); // fallback

        navigateToUrl('/bar'); // delay cancel activating, outdated
        await delay(50);
        navigateToUrl('/baz');
        await delay(100);
        expect(container.currentMountedApp?.name).toBe('baz');

        expect(rerouteEvent && parseUri(rerouteEvent.oldUrl).pathname).toBe('/bar');
        expect(rerouteEvent && parseUri(rerouteEvent.newUrl).pathname).toBe('/baz');
    });

    it(`delay cancel in right order`, async () => {
        let rerouteEvent: LocalRouterNavigation | undefined;
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app, evt: LocalRouterNavigation): Promise<boolean> => {
                rerouteEvent = evt;
                if (app === 'bar') {
                    return delay(40).then(() => true);
                }

                if (app === 'baz') {
                    return delay(20).then(() => true);
                }

                return Promise.resolve(false);
            },
            fallbackUrl: '/foo',
        });

        container.registerApps([
            {
                name: 'foo',
                activeWhen: '/foo',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
        ]);

        container.run();

        await delay(10);

        expect(location.pathname).toBe('/foo'); // fallback

        navigateToUrl('/bar'); // delay cancel activating, outdated
        navigateToUrl('/baz');
        await delay(100);
        expect(container.currentMountedApp?.name).toBe('foo');
        expect(location.pathname).toBe('/foo');
        getUniversalRouter().reroute();
        expect(rerouteEvent && parseUri(rerouteEvent.oldUrl).pathname).toBe('/foo');
        expect(rerouteEvent && parseUri(rerouteEvent.newUrl).pathname).toBe('/foo');
    });

    it(`delay cancel in reverse order`, async () => {
        let rerouteEvent: LocalRouterNavigation | undefined;
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app, evt: LocalRouterNavigation): Promise<boolean> => {
                rerouteEvent = evt;

                // foo(base) - bar(cancelled after 20ms) - baz(cancelled after 40ms)

                if (app === 'bar') {
                    return delay(20).then(() => true);
                }

                if (app === 'baz') {
                    return delay(40).then(() => true);
                }

                return Promise.resolve(false);
            },
            fallbackUrl: '/foo',
        });

        container.registerApps([
            {
                name: 'foo',
                activeWhen: '/foo',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
        ]);

        container.run();

        await delay(10);

        expect(location.pathname).toBe('/foo'); // fallback

        navigateToUrl('/bar'); // delay cancel activating, outdated
        navigateToUrl('/baz');
        await delay(100);
        expect(container.currentMountedApp?.name).toBe('foo');
        expect(location.pathname).toBe('/foo');
        getUniversalRouter().reroute();
        expect(rerouteEvent && parseUri(rerouteEvent.oldUrl).pathname).toBe('/foo');
        expect(rerouteEvent && parseUri(rerouteEvent.newUrl).pathname).toBe('/foo');
    });

    it(`delay cancel do not block normal app`, async () => {
        let rerouteEvent: LocalRouterNavigation | undefined;
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app, evt: LocalRouterNavigation): Promise<boolean> => {
                rerouteEvent = evt;

                // foo(cancelled after 20ms) - bar(bootstrapping for 25ms) - baz(cancelled after 30ms) - opq(cancelled after 40ms)

                if (app === 'foo') {
                    return delay(20).then(() => true);
                }

                if (app === 'baz') {
                    return delay(30).then(() => true);
                }

                if (app === 'opq') {
                    return delay(40).then(() => true);
                }

                return Promise.resolve(false);
            },
        });

        container.registerApps([
            {
                name: 'foo',
                activeWhen: '/foo',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    bootstrap: (): Promise<void> => delay(25),
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
            {
                name: 'opq',
                activeWhen: '/opq',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            },
        ]);

        container.run();

        await delay(10);

        expect(location.pathname).toBe('/'); // base

        navigateToUrl('/foo');
        navigateToUrl('/bar');
        await delay(10);
        navigateToUrl('/baz');
        navigateToUrl('/opq');
        await delay(50);
        expect(container.currentMountedApp?.name).toBe('bar');

        getUniversalRouter().reroute();
        expect(rerouteEvent && parseUri(rerouteEvent.oldUrl).pathname).toBe('/bar');
        expect(rerouteEvent && parseUri(rerouteEvent.newUrl).pathname).toBe('/bar');
    });
});
