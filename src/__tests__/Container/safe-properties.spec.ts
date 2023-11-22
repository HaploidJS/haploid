import { ManualContainer } from '../../index';

describe.only(`safe-properties`, () => {
    let container: ManualContainer;

    beforeEach(() => {
        container = new ManualContainer({
            name: 'root',
            root: '#app',
        });
    });

    afterEach(() => container.destroy());

    it(`has a readonly apps property`, () => {
        expect(container.apps).toEqual([]);
        expect(Reflect.set(container, 'apps', [])).toBe(false);

        container.registerApp({
            name: 'foo',
            entry: 'x',
        });

        expect(container.apps.length).toBe(1);
        expect(container.apps[0].name).toBe('foo');
    });

    it(`has a readonly hooks property`, () => {
        expect(container.hooks).not.toBeNull();
        expect(Reflect.set(container, 'hooks', {})).toBe(false);
        expect(Reflect.deleteProperty(container.hooks, 'afterrootready')).toBe(false);
    });

    it(`has a readonly options property`, () => {
        expect(container.options).toEqual({
            name: 'root',
            root: '#app',
        });
        expect(Reflect.set(container, 'options', {})).toBe(false);
    });

    it(`has an readonly currentMountedApp property`, () => {
        expect(container.currentMountedApp).toBeNull();
        expect(Reflect.set(container, 'currentMountedApp', null)).toBe(false);
    });

    it(`has a readonly isDestroying property`, async () => {
        expect(container.isDestroying).toBe(false);
        expect(Reflect.set(container, 'isDestroying', false)).toBe(false);

        const destroyingPromise = container.destroy();
        expect(container.isDestroying).toBe(true);
        await destroyingPromise;
        expect(container.isDestroying).toBe(false);
    });

    it(`has a readonly isDestroyed property`, async () => {
        expect(container.isDestroyed).toBe(false);
        expect(Reflect.set(container, 'isDestroyed', false)).toBe(false);

        await container.destroy();
        expect(container.isDestroyed).toBe(true);
    });
});
