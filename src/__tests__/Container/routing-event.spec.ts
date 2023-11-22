import { RouterContainer, navigateToUrl } from '../../index';
import { delay, createRoot, removeRoot } from '../../../spec/test-utils';

describe.only(`routing-event`, () => {
    beforeEach(() => {
        navigateToUrl('/test');
        return delay(10);
    });

    it(`skipped events`, async () => {
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp(app, evt): boolean | Promise<boolean> {
                if (app === 'bar') {
                    //
                    if (evt.newUrl.endsWith('/bar/about')) {
                        return false;
                    } else {
                        return delay(100).then(() => false);
                    }
                }
                return false;
            },
        });

        container.registerApps([
            {
                name: 'foo',
                activeWhen: '/foo',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        container.run();

        const onPopstate = jest.fn();
        window.addEventListener('popstate', onPopstate);

        navigateToUrl('/foo');
        await delay(0);
        navigateToUrl('/bar');
        await delay(0);
        navigateToUrl('/bar/about');
        await delay(0);

        expect(onPopstate).toHaveBeenCalledTimes(2);

        await container.destroy();

        window.removeEventListener('popstate', onPopstate);
    });

    it(`A(approved after 50ms)->B(cancelled after 100ms) makes A mounted and fires one popstate`, async () => {
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp(app): boolean | Promise<boolean> {
                if (app === 'bar') {
                    return delay(50).then(() => false);
                }

                if (app === 'baz') {
                    return delay(100).then(() => true);
                }
                return false;
            },
        });

        container.registerApps([
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        container.run();

        const onPopstate = jest.fn();
        window.addEventListener('popstate', onPopstate);

        navigateToUrl('/bar');
        await delay(0);
        navigateToUrl('/baz');
        await delay(200);

        expect(onPopstate).toHaveBeenCalledTimes(1);
        expect(container.currentMountedApp?.name).toBe('bar');
        await container.destroy();
        window.removeEventListener('popstate', onPopstate);
    });

    it(`A(approved after 100ms)->B(cancelled after 50ms) makes A mounted and fires one popstate`, async () => {
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp(app): boolean | Promise<boolean> {
                if (app === 'bar') {
                    return delay(100).then(() => false);
                }

                if (app === 'baz') {
                    return delay(50).then(() => true);
                }
                return false;
            },
        });

        container.registerApps([
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        container.run();

        const onPopstate = jest.fn();
        window.addEventListener('popstate', onPopstate);

        navigateToUrl('/bar');
        await delay(0);
        navigateToUrl('/baz');
        await delay(200);

        expect(onPopstate).toHaveBeenCalledTimes(1);
        expect(container.currentMountedApp?.name).toBe('bar');
        await container.destroy();
        window.removeEventListener('popstate', onPopstate);
    });

    it(`A(cancelled after 50ms)->B(approved after 100ms) makes B mounted and fires one popstate`, async () => {
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp(app): boolean | Promise<boolean> {
                if (app === 'bar') {
                    return delay(50).then(() => true);
                }

                if (app === 'baz') {
                    return delay(100).then(() => false);
                }
                return false;
            },
        });

        container.registerApps([
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        container.run();

        const onPopstate = jest.fn();
        window.addEventListener('popstate', onPopstate);

        navigateToUrl('/bar');
        await delay(0);
        navigateToUrl('/baz');
        await delay(200);

        expect(onPopstate).toHaveBeenCalledTimes(1);
        expect(container.currentMountedApp?.name).toBe('baz');
        await container.destroy();
        window.removeEventListener('popstate', onPopstate);
    });

    it(`A(cancelled after 100ms)->B(approved after 50ms) makes B mounted and fires one popstate`, async () => {
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp(app): boolean | Promise<boolean> {
                if (app === 'bar') {
                    return delay(100).then(() => true);
                }

                if (app === 'baz') {
                    return delay(50).then(() => false);
                }
                return false;
            },
        });

        container.registerApps([
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'baz',
                activeWhen: '/baz',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        container.run();

        const onPopstate = jest.fn();
        window.addEventListener('popstate', onPopstate);

        navigateToUrl('/bar');
        await delay(0);
        navigateToUrl('/baz');
        await delay(200);

        expect(onPopstate).toHaveBeenCalledTimes(1);
        expect(container.currentMountedApp?.name).toBe('baz');
        await container.destroy();
        window.removeEventListener('popstate', onPopstate);
    });

    it(`initial location cannot be cancelled`, async () => {
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
            cancelActivateApp(): boolean | Promise<boolean> {
                return true;
            },
        });

        container.registerApps([
            {
                name: 'test',
                activeWhen: '/test',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        container.run();

        await delay(0);

        expect(container.currentMountedApp?.name).toBeUndefined();
        await container.destroy();
    });

    // The following two navigation are all cancelled.
    //
    //  /foo->                      | /bar->
    // A------------veto------------|-------------------[vetoed]--------veto [vetoed]
    // B-------------|--------------|--------------pass [vetoed]--------veto [vetoed]
    // --------------|--------------|---------------|--------------------|----------
    //              10ms           30ms            50ms                 80ms
    it(`past url can also be cancelled`, async () => {
        const rootA = createRoot('appA');
        const rootB = createRoot('appB');

        const containerA = new RouterContainer({
            name: 'rootA',
            root: rootA,
            cancelActivateApp(app): boolean | Promise<boolean> {
                if (app === 'foo') return delay(10).then(() => true);
                if (app === 'bar') return delay(50).then(() => true);
                return false;
            },
        });

        const containerB = new RouterContainer({
            name: 'rootB',
            root: rootB,
            cancelActivateApp(app): boolean | Promise<boolean> {
                if (app === 'foo') return delay(50).then(() => false);
                if (app === 'bar') return delay(30).then(() => true);
                return false;
            },
        });

        const bootstrapA = jest.fn();

        containerA.registerApps([
            {
                name: 'foo',
                activeWhen: '/foo',
                lifecycle: {
                    bootstrap: bootstrapA,
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        containerB.registerApps([
            {
                name: 'foo',
                activeWhen: '/foo',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'bar',
                activeWhen: '/bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        containerA.run();
        containerB.run();
        await delay(0);

        const onPopstate = jest.fn();
        window.addEventListener('popstate', onPopstate);

        navigateToUrl('/foo');
        await delay(30);
        navigateToUrl('/bar');
        await delay(100);

        expect(bootstrapA).toHaveBeenCalledTimes(0);
        expect(onPopstate).toHaveBeenCalledTimes(0);
        expect(containerA.currentMountedApp?.name).toBeUndefined();
        expect(containerB.currentMountedApp?.name).toBeUndefined();

        await containerA.destroy();
        await containerB.destroy();
        window.removeEventListener('popstate', onPopstate);
        removeRoot(rootA);
        removeRoot(rootB);
    });
});
