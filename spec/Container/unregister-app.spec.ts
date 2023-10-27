import { RouterContainer, navigateToUrl } from '@/index';
import { delay } from '../test-utils';

describe.only(`unregister-app`, () => {
    it(`unregister lead to reroute`, async () => {
        const container = new RouterContainer({
            root: '#app',
            name: 'test',
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
                activeWhen: ['/bar', '/foo'],
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

        expect(container.currentMountedApp?.name).toBe('foo'); // match foo

        await container.unregisterApp('foo');
        expect(container.apps.find(app => app.name === 'foo')).toBeUndefined();
        await delay(10);

        expect(container.currentMountedApp?.name).toBe('bar'); // reroute to bar

        await container.destroy();
    });

    it(`unregister rejected if app not found`, async () => {
        const container = new RouterContainer({
            root: '#app',
            name: 'test',
        });

        container.registerApps([
            {
                name: 'bar',
                activeWhen: ['/bar', '/foo'],
                lifecycle: {
                    mount: async (): Promise<void> => {},
                    unmount: async (): Promise<void> => {},
                },
            },
        ]);

        await expect(container.unregisterApp('foo')).rejects.toThrow(/Cannot find app/i);

        await container.destroy();
    });
});
