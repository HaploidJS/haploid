import { createLifecycle } from './utils';

describe.only('instance', () => {
    it(`toString() is "[object Lifecycle]"`, async () => {
        const lifecycle = createLifecycle();
        expect({}.toString.call(lifecycle)).toBe('[object Lifecycle]');
    });

    it(`String($instance) is "Lifecycle($name)"`, async () => {
        const lifecycle = createLifecycle();
        expect(String(lifecycle)).toBe('Lifecycle(foo)');
    });

    it(`$instance + 5 is "Lifecycle($name) 5"`, async () => {
        const lifecycle = createLifecycle();

        // @ts-ignore test
        expect(lifecycle + 5).toBe('Lifecycle(foo)5');
    });

    it('safe hooks property', async () => {
        const lifecycle = createLifecycle();

        const hooksDescriptor = Reflect.getOwnPropertyDescriptor(lifecycle, 'hooks');

        expect(hooksDescriptor?.configurable).toBe(false);
        expect(hooksDescriptor?.enumerable).toBe(false);
        expect(hooksDescriptor?.writable).toBe(false);

        expect(Object.isFrozen(lifecycle.hooks)).toBe(true);
    });
});
