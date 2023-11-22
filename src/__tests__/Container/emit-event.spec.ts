import { ManualContainer, RouterContainer, navigateToUrl } from '../../index';
import { delay } from '../../../spec/test-utils';

describe.only(`emit-event`, () => {
    let container: RouterContainer | ManualContainer;

    afterEach(() => container?.destroy());

    it(`emit destroying and destroyed`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        const onDestroying = jest.fn();
        const onDestroyed = jest.fn();

        container.on('destroying', onDestroying);
        container.on('destroyed', onDestroyed);

        await container.destroy();

        expect(onDestroying).toHaveBeenCalledTimes(1);
        expect(onDestroyed).toHaveBeenCalledTimes(1);
    });

    it(`emit appactivateerror in ManualContainer`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });
        const onAppActivated = jest.fn();
        const onAppActivateError = jest.fn();

        container.on('appactivateerror', onAppActivateError);
        container.on('noappactivated', onAppActivated);

        await expect(container.activateApp('foo')).rejects.toThrow(/cannot find/);
        expect(onAppActivateError).toHaveBeenCalledTimes(1);

        await expect(container.activateApp(null)).resolves.toBeNull();
        expect(onAppActivated).toHaveBeenCalledTimes(1);
    });

    it(`emit noappactivated(repeatly) in RouterContainer`, async () => {
        container = new RouterContainer({
            name: 'root',
            root: '#app',
        });
        const noAppActivated = jest.fn();

        container.on('noappactivated', noAppActivated);

        container.run();

        await delay(10); // no active
        expect(noAppActivated).toHaveBeenCalledTimes(1);

        navigateToUrl('/'); // no active
        await delay(10);
        expect(noAppActivated).toHaveBeenCalledTimes(2);

        location.hash = 'hash'; // no active
        await delay(10);
        expect(noAppActivated).toHaveBeenCalledTimes(4); // emit again, hashchange=>popstate
    });

    it(`emit appactivating/appactivated/appactivateerror`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        let activatingApp;
        let activatedApp;
        let activateerrorApp;
        const onAppActivatedOnce = jest.fn();

        container.on('appactivating', ({ appname }): void => {
            activatingApp = appname;
        });

        container.on('appactivated', ({ appname }): void => {
            activatedApp = appname;
        });

        container.once('appactivated', onAppActivatedOnce);

        container.on('appactivateerror', ({ appname }): void => {
            activateerrorApp = appname;
        });

        container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async (): Promise<void> => {},
                unmount: async (): Promise<void> => {},
            },
        });

        container.registerApp({
            name: 'bar',
            lifecycle: {
                mount: async (): Promise<void> => {},
                unmount: async (): Promise<void> => {},
                bootstrap: async (): Promise<void> => {
                    throw Error('mock error');
                },
            },
        });

        let activatingPromise = container.activateApp('foo');
        expect(activatingApp).toBe('foo');
        await activatingPromise;
        expect(activatedApp).toBe('foo');

        activatingPromise = container.activateApp('bar');
        expect(activatingApp).toBe('bar');
        await expect(activatingPromise).rejects.toThrow('mock error');
        expect(activateerrorApp).toBe('bar');

        await expect(container.activateApp('baz')).rejects.toThrow(/cannot find/);
        expect(activateerrorApp).toBe('baz');

        expect(onAppActivatedOnce).toHaveBeenCalledTimes(1);
    });

    it('activating conflicts eat events', async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        const onAppactivating = jest.fn();
        const onAppactivated = jest.fn();
        const onAppactivaterrror = jest.fn();
        container.on('appactivating', onAppactivating);
        container.on('appactivated', onAppactivated);
        container.on('appactivateerror', onAppactivaterrror);

        const [, barApp] = container.registerApps([
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
            {
                name: 'moon',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
            {
                name: 'sun',
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                    bootstrap: async (): Promise<void> => {
                        throw Error('mock error');
                    },
                },
            },
        ]);

        const activatingFooPromise = container.activateApp('foo');
        const activatingBarPromise = container.activateApp('bar');
        await expect(activatingFooPromise).rejects.toThrow(/interrupted by bar/);
        await expect(activatingBarPromise).resolves.toStrictEqual(barApp);
        expect(onAppactivating).toHaveBeenCalledTimes(2);
        expect(onAppactivated).toHaveBeenCalledTimes(1);

        const activatingMoonPromise = container.activateApp('moon');
        const activatingSunPromise = container.activateApp('sun');
        await expect(activatingMoonPromise).rejects.toThrow(/interrupted by sun/);
        await expect(activatingSunPromise).rejects.toThrow('mock error');
        expect(onAppactivating).toHaveBeenCalledTimes(4);
        expect(onAppactivaterrror).toHaveBeenCalledTimes(1);
    });

    it(`emit throws won't break down`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });
        const fooApp = container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
        });
        container.once('appactivating', () => {
            throw Error('mock error');
        });

        await expect(container.activateApp('foo')).resolves.toStrictEqual(fooApp);
    });

    it(`emit appregistererror`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });
        container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
        });
        const onAppregistererror = jest.fn();
        container.once('appregistererror', onAppregistererror);
        container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
        });

        expect(onAppregistererror).toHaveBeenCalledTimes(1);
    });
});
