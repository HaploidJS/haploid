import { RouterContainer, navigateToUrl } from '@/index';
import { parseUri } from '@/utils/navigateToUrl';
import { RouterNavigation, getUniversalRouter } from '@/Router';
import { delay, createRoot, removeRoot } from '../test-utils';

type LocalRouterNavigation = Omit<RouterNavigation, 'isCanceled'>;

describe.only(`cancel-activate`, () => {
    let container: RouterContainer;

    beforeEach(() => {
        navigateToUrl('/');
        return delay(10);
    });

    afterEach(() => container?.destroy());

    it(`cancel successfully`, async () => {
        let rerouteEvent: LocalRouterNavigation | undefined;
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app, evt: LocalRouterNavigation): boolean => {
                rerouteEvent = evt;
                return app === 'baz';
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

        navigateToUrl('/bar');
        await delay(10);
        expect(container.currentMountedApp?.name).toBe('bar'); // the second

        expect(rerouteEvent && parseUri(rerouteEvent.oldUrl).pathname).toBe('/foo');
        expect(rerouteEvent && parseUri(rerouteEvent.newUrl).pathname).toBe('/bar');

        navigateToUrl('/baz'); // will be cancelled
        await delay(10);

        expect(location.pathname).toBe('/bar');

        expect(rerouteEvent && parseUri(rerouteEvent.oldUrl).pathname).toBe('/bar');
        expect(rerouteEvent && parseUri(rerouteEvent.newUrl).pathname).toBe('/bar');

        // Trying to change the newUrl won't work.
        expect(() => {
            if (rerouteEvent) rerouteEvent.newUrl = '/xxx';
        }).toThrow(/read only/);

        getUniversalRouter().reroute();
        // Old is set to new when reroute.
        expect(rerouteEvent && parseUri(rerouteEvent.oldUrl).pathname).toBe('/bar');
        expect(rerouteEvent && parseUri(rerouteEvent.newUrl).pathname).toBe('/bar');
    });

    // The app baz should be finally activated, even bar is approved later.
    //
    // -/bar->-------|-/baz->
    // --------------|-[approved /baz]-------------------------[approved] /bar
    // -------------10ms----------------------------------------40ms
    it(`cancel cannot block newer`, async () => {
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app): Promise<boolean> => {
                if (app === 'bar') {
                    return delay(40).then(() => false);
                }

                return Promise.resolve(false);
            },
        });

        container.registerApps([
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

        await delay(0);

        navigateToUrl('/bar');
        await delay(10);
        navigateToUrl('/baz');
        await delay(40);

        expect(container.currentMountedApp?.name).toBe('baz');
    });

    // The app bar should not be activated, it cancels navigations always.
    //
    // -/foo->-------|-/bar->-------|-/baz->-------|-/bar->---------------------------------------------
    // --------------|--------------|--------------|[cancelled] /baz------|[cancelled] /bar---------------
    // -------------10ms-----------20ms-----------30ms------------------40ms---------------50ms---------
    it(`navigation cancelation should not force activating app`, async () => {
        let enterBarTimes = 0;
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app): Promise<boolean> => {
                if (app === 'bar') {
                    if (++enterBarTimes === 1) return delay(500).then(() => true);
                    else return delay(10).then(() => true);
                }

                if (app === 'baz') {
                    return delay(10).then(() => true);
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
        navigateToUrl('/bar');
        await delay(10);
        navigateToUrl('/baz');
        await delay(120);
        expect(container.currentMountedApp?.name).toBe('foo');
    });

    it(`navigation cancelation should not lead to dead loop`, async () => {
        let enterBarTimes = 0;
        const apps: Array<string | undefined> = [];
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp: (app): Promise<boolean> => {
                apps.push(app);
                if (app === 'bar') {
                    if (++enterBarTimes === 1) return delay(500).then(() => true);
                    else return delay(10).then(() => true);
                }

                if (app === 'baz') {
                    return delay(10).then(() => true);
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
        navigateToUrl('/bar');
        await delay(10);
        navigateToUrl('/baz');
        await delay(220);
        expect(apps).toEqual([undefined, 'foo', 'bar', 'baz', 'bar']);
    });

    it(`broken cancelActivateApp or activeWhen acts as passed and dom-ready`, async () => {
        const appA = createRoot('appA');
        const appB = createRoot('appB');
        const appC = createRoot('appC');

        const containerA = new RouterContainer({
            name: 'rootA',
            root: appA,
            cancelActivateApp: (): Promise<boolean> | boolean => {
                if (location.pathname.endsWith('/foo')) {
                    throw Error('mock error');
                }
                return false;
            },
        });

        containerA.registerApps([
            {
                name: 'foo',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
                activeWhen: '/foo',
            },
        ]);

        const containerB = new RouterContainer({
            name: 'rootB',
            root: appB,
        });

        containerB.registerApps([
            {
                name: 'foo',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
                activeWhen: (loc): boolean => {
                    if (loc.pathname.endsWith('/foo')) {
                        throw Error('mock error');
                    }
                    return false;
                },
            },
        ]);

        const containerC = new RouterContainer({
            name: 'rootC',
            root: appC,
            // @ts-ignore for test
            cancelActivateApp: 3,
        });

        containerC.registerApps([
            {
                name: 'foo',
                lifecycle: {
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
                activeWhen: '/foo',
            },
        ]);

        containerA.run();
        containerB.run();
        containerC.run();

        await delay(0);
        navigateToUrl('/foo');
        await delay(10);

        expect(containerC.currentMountedApp?.name).toBe('foo');

        await Promise.all([containerA.destroy(), containerB.destroy(), containerC.destroy()]);
        removeRoot(appA);
        removeRoot(appB);
        removeRoot(appC);
    });
});
