import { ManualContainer, RouterContainer, navigateToUrl } from '@/index';
import { delay } from '../../../spec/test-utils';
import { AppLocation } from '@/Def';

describe.only(`activate-app`, () => {
    let container: RouterContainer | ManualContainer;

    beforeEach(async () => {
        navigateToUrl('/');
        return delay(10);
    });

    afterEach(() => container?.destroy());

    it('activating repeatly reuse', async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        container.registerApps([
            {
                name: 'foo',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        await container.activateApp('foo');
        await expect(
            Promise.allSettled([container.activateApp('bar'), container.activateApp('bar')])
        ).resolves.toMatchObject([
            {
                status: 'fulfilled',
            },
            {
                status: 'fulfilled',
            },
        ]);
    });

    it('parallel activating interrupts', async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        const [, barApp] = container.registerApps([
            {
                name: 'foo',
                lifecycle: {
                    mount: async (): Promise<void> => delay(100),
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'bar',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'moon',
                lifecycle: Promise.resolve({
                    mount: [
                        (): Promise<unknown> => delay(100),
                        async (): Promise<void> => Promise.reject(Error('mock error')),
                    ],
                    unmount: async (): Promise<void> => {},
                }),
            },
            {
                name: 'sun',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                    bootstrap: async (): Promise<void> => Promise.reject(Error('mock error')),
                },
            },
        ]);

        const activatingFooPromise = container.activateApp('foo');
        await delay(10);
        const activatingBarPromise = container.activateApp('bar');
        await expect(activatingFooPromise).rejects.toThrow(/interrupted by bar/);
        await expect(activatingBarPromise).resolves.toStrictEqual(barApp);

        const activatingMoonPromise = container.activateApp('moon');
        await delay(10);
        const activatingSunPromise = container.activateApp('sun');
        await expect(activatingMoonPromise).rejects.toThrow(/suspended/);
        await expect(activatingSunPromise).rejects.toThrow('mock error');
    });

    it(`router failed`, async () => {
        container = new RouterContainer({
            name: 'root',
            root: '#app',
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
                activeWhen: (loc: AppLocation): boolean => loc.pathname.startsWith('/bar'),
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                    bootstrap: async (): Promise<void> => Promise.reject(Error('mock error')),
                },
            },
        ]);

        navigateToUrl('/foo/about');
        container.run();
        await delay(10);
        expect(container.currentMountedApp?.name).toBe('foo');

        navigateToUrl('/bar/about');
        await delay(10);
        expect(container.currentMountedApp).toBe(null);
    });
});
