import { ManualContainer, RouterContainer, navigateToUrl } from '@/index';
import { AppLocation } from '@/Def';
import type { AppPlugin } from '@/Plugin';
import { delay } from '../test-utils';

describe.only(`register-app`, () => {
    let container: RouterContainer | ManualContainer;

    afterEach(() => container?.destroy());

    it(`registerApp() with plugin`, async () => {
        let installed = false;

        function createPluginConsole<S, T>(): AppPlugin<S, T> {
            return () => {
                installed = true;
            };
        }

        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        container.registerApp(
            {
                name: 'foo',
                entry: '/foo.json',
                foo: {},
            },
            [['PluginConsole', createPluginConsole()]]
        );

        expect(() => {
            (container as ManualContainer).registerApp(
                {
                    name: 'bar',
                    entry: '/bar.json',
                },
                // @ts-ignore for test
                'x'
            );
        }).toThrow(/must be an array/);

        expect(installed).toBe(true);
    });

    it(`registerApp() duplicated is silent`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        container.registerApp({
            name: 'foo',
            entry: '/',
        });

        expect(() => {
            (container as ManualContainer).registerApp({
                name: 'foo',
                entry: '/',
            });
        }).not.toThrow();

        expect(container.apps).toHaveLength(1);
    });

    it(`registerApps() duplicated is silent`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        expect(() => {
            (container as ManualContainer).registerApps([
                {
                    name: 'foo',
                    entry: '/',
                },
                {
                    name: 'foo',
                    entry: '/',
                },
            ]);
        }).not.toThrow();

        expect(container.apps).toHaveLength(1);
    });

    it(`register lead to reroute`, async () => {
        const onAppActivated = jest.fn();
        container = new RouterContainer({
            root: '#app',
            name: 'test',
        });

        container.registerApps([
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
        container.run();
        await delay(10);

        expect(container.currentMountedApp).toBeNull(); // match no app

        container.on('appactivated', onAppActivated);

        container.registerApp({
            name: 'foo',
            activeWhen: (loc: AppLocation): boolean => loc.pathname.startsWith('/foo'),
            lifecycle: {
                mount: async (): Promise<void> => {},
                unmount: async (): Promise<void> => {},
            },
        });

        await delay(10);

        expect(onAppActivated).toHaveBeenCalledTimes(1);
        expect(container.currentMountedApp?.name).toBe('foo'); // match foo
    });

    it(`registerApp(s) return AppShadow`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        const app = (container as ManualContainer).registerApp({
            name: 'foo',
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
        });

        await container.activateApp('foo');
        await expect(app.update({})).rejects.toThrow(/has no update/);
    });
});
