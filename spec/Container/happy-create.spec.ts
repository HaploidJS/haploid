import { delay, createRoot, removeRoot } from '../test-utils';
import { ManualContainer, navigateToUrl } from '@/index';

describe.only(`happy-create`, () => {
    let container: ManualContainer;

    beforeEach(async () => {
        navigateToUrl('/');
        return delay(10);
    });

    afterEach(() => container?.destroy());

    it(`cannot attach to same DOM`, async () => {
        const root = createRoot('xroot');
        root.className = 'app';
        container = new ManualContainer({
            name: 'root',
            root,
        });

        expect(() => {
            new ManualContainer({
                name: 'root',
                root,
            });
        }).toThrow(/<div id="xroot" class="app"><\/div> has already been attached/);

        removeRoot(root);
    });

    it(`currentMountedApp/currentActiveApp returns correctly`, async () => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });

        const app = container.registerApp({
            name: 'foo',
            lifecycle: {
                mount: async () => {},
                unmount: async () => {},
            },
        });

        await expect(container.activateApp('foo')).resolves.toStrictEqual(app);
        expect(container.currentMountedApp).toBe(app);
        expect(container.currentActiveApp).toBe(app);
    });
});
