import { ManualContainer, RouterContainer, navigateToUrl } from '@/index';
import { AppLocation } from '@/Def';
import { smellsLikeAPromise } from '@/utils/smellsLikeAPromise';
import { delay } from '../test-utils';

describe.only(`happy-destroy`, () => {
    let manualContainer: ManualContainer;

    beforeEach(() => {
        manualContainer = new ManualContainer({
            root: '#app',
            name: 'test',
        });
    });

    afterEach(() => manualContainer.destroy());

    it(`destroy() always return same promise`, () => {
        expect(smellsLikeAPromise(manualContainer.destroy())).toStrictEqual(true);
        expect(manualContainer.destroy()).toBe(manualContainer.destroy());
    });

    it(`on()/once()/off()/registerApps()/registerApp()/mountApp() throws if destroy(ed/ing)`, async () => {
        await manualContainer.destroy();

        expect(() => manualContainer.on('destroyed', () => {})).toThrow(/is destroying or destroyed/);
        expect(() => manualContainer.once('destroyed', () => {})).toThrow(/is destroying or destroyed/);
        expect(() => manualContainer.off('destroyed', () => {})).toThrow(/is destroying or destroyed/);
        expect(() => manualContainer.registerApps([])).toThrow(/is destroying or destroyed/);
        expect(() =>
            manualContainer.registerApp({
                name: 'foo',
                entry: 'x',
            })
        ).toThrow(/is destroying or destroyed/);
        expect(manualContainer.activateApp('foo')).rejects.toThrow(/is destroying or destroyed/);
    });

    it(`run() router throws if destroy(ed/ing)`, async () => {
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
        });

        container.destroy();

        expect(() => {
            container.run();
        }).toThrow(/is destroying or destroyed/);
    });

    it(`destroy() clears everything`, async () => {
        await manualContainer.destroy();
        const routerContainer = new RouterContainer({
            root: '#app',
            name: 'test',
        });

        routerContainer.registerApps([
            {
                name: 'foo',
                activeWhen: (loc: AppLocation): boolean => loc.pathname.startsWith('/foo'),
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => delay(100),
                },
            },
            {
                name: 'bar',
                activeWhen: (loc: AppLocation): boolean => loc.pathname.startsWith('/bar'),
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        navigateToUrl('/foo/about');
        await delay(10);
        routerContainer.run();
        routerContainer.run();
        await delay(30);

        const destroyingPromise = routerContainer.destroy();

        expect(routerContainer.isDestroying).toBe(true);
        expect(() => routerContainer.run()).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.registerApps([])).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.registerApp({ name: 'foo', entry: '/entry.json', activeWhen: jest.fn() })).toThrow(
            /destroying or destroyed/
        );
        expect(() => routerContainer.on('appactivated', jest.fn())).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.once('appactivated', jest.fn())).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.off('appactivated', jest.fn())).toThrow(/destroying or destroyed/);

        await destroyingPromise;

        expect(routerContainer.isDestroyed).toBe(true);
        expect(routerContainer.apps).toHaveLength(0);
        expect(() => routerContainer.run()).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.registerApps([])).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.registerApp({ name: 'foo', entry: '/entry.json', activeWhen: jest.fn() })).toThrow(
            /destroying or destroyed/
        );
        expect(() => routerContainer.on('appactivated', jest.fn())).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.once('appactivated', jest.fn())).toThrow(/destroying or destroyed/);
        expect(() => routerContainer.off('appactivated', jest.fn())).toThrow(/destroying or destroyed/);
    });
});
