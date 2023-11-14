import { RouterContainer, navigateToUrl } from '@/index';
import { delay, createRoot, removeRoot } from '../test-utils';

describe.only(`fallback-redirect`, () => {
    let container: RouterContainer;

    beforeEach(async () => {
        navigateToUrl('/');
        return delay(10);
    });

    afterEach(() => container?.destroy());

    it(`fallbackUrl as pathname works`, async () => {
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            fallbackUrl: '/foo/bar',
        });

        container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async () => {},
                unmount: async () => {},
            },
            activeWhen: '/foo/',
        });

        const noAppActivated = jest.fn();

        container.on('noappactivated', noAppActivated);

        container.run();
        await delay(50);
        expect(location.pathname).toBe('/foo/bar');

        expect(noAppActivated).not.toHaveBeenCalled(); // No noappactivated emitted.
    });

    it(`fallbackUrl as hash works`, async () => {
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            fallbackUrl: '#/foo',
        });

        container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async () => {},
                unmount: async () => {},
            },
            activeWhen: loc => loc.hash.startsWith('#/foo'),
        });

        const noAppActivated = jest.fn();

        container.on('noappactivated', noAppActivated);

        container.run();
        await delay(50);
        expect(location.hash).toBe('#/foo');

        expect(noAppActivated).not.toHaveBeenCalled(); // No noappactivated emitted.
    });

    it(`fallbackUrl doesn't work if not match any app`, async () => {
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            fallbackUrl: '/bar',
        });

        container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async () => {},
                unmount: async () => {},
            },
            activeWhen: '/foo/',
        });

        container.run();
        await delay(10);
        expect(location.pathname).not.toBe('/bar');
    });

    it(`fallbackOnlyWhen works`, async () => {
        container = new RouterContainer({
            name: 'root',
            root: '#app',
            fallbackUrl: '/foo/',
            fallbackOnlyWhen: (loc): boolean => loc.pathname === '/',
        });

        container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async () => {},
                unmount: async () => {},
            },
            activeWhen: '/foo/',
        });

        container.run();
        await delay(10);
        expect(location.pathname).not.toBe('/foo');
        navigateToUrl('/xxx');
        await delay(10);
        expect(location.pathname).toBe('/xxx');
    });

    it(`fallbackUrl in conflict`, async () => {
        const appA = createRoot('appA');
        const appB = createRoot('appB');

        const containerA = new RouterContainer({
            name: 'rootA',
            root: appA,
            fallbackUrl: '/foo/A',
            fallbackOnlyWhen: (loc): boolean => loc.pathname === '/xxx' || loc.pathname === '/',
        });

        const containerB = new RouterContainer({
            name: 'rootB',
            root: appB,
            fallbackUrl: '/foo/B',
            fallbackOnlyWhen: (loc): boolean => loc.pathname === '/xxx' || loc.pathname === '/',
        });

        containerA.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async () => {},
                unmount: async () => {},
            },
            activeWhen: '/foo',
        });

        containerB.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async () => {},
                unmount: async () => {},
            },
            activeWhen: '/foo',
        });

        containerA.run();
        containerB.run();

        await delay(0);
        // 💡 This is important, because containers cannot run at the same time, the router must be aware both.
        expect(location.pathname).toBe('/');
        navigateToUrl('/xxx');
        await delay(0);
        expect(location.pathname).toBe('/xxx');

        await Promise.all([containerA.destroy(), containerB.destroy()]);
        removeRoot(appA);
        removeRoot(appB);
    });
});
