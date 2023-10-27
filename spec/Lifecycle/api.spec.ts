import { createLifecycle } from './utils';

describe.only('api', () => {
    it('api is frozen', async () => {
        const lifecycle = createLifecycle();
        expect(Object.isFrozen(lifecycle.api)).toBe(true);
    });

    it('api.fns is frozen', async () => {
        const lifecycle = createLifecycle();
        expect(Object.isFrozen(lifecycle.api.fns)).toBe(true);
    });

    it('api.fns.raw === lifecycle.fns', async () => {
        const lifecycle = createLifecycle();
        expect(lifecycle.api.fns.raw).toStrictEqual(lifecycle.fns);
    });

    it('api.hooks === lifecycle.hooks', async () => {
        const lifecycle = createLifecycle();
        expect(lifecycle.api.hooks).toStrictEqual(lifecycle.hooks);
    });

    it('api.customProps == lifecycle.customProps', async () => {
        const lifecycle = createLifecycle();
        expect(lifecycle.api.customProps).toStrictEqual(lifecycle.customProps);
    });

    it('api.on works', async () => {
        const lifecycle = createLifecycle();
        const beforemount = jest.fn();
        lifecycle.api.on('beforemount', beforemount);
        await lifecycle.mount();
        expect(beforemount).toHaveBeenCalled();
    });

    it('api.once works', async () => {
        const lifecycle = createLifecycle();
        const beforemount = jest.fn();
        lifecycle.api.once('beforemount', beforemount);
        await lifecycle.mount();
        await lifecycle.mount();
        expect(beforemount).toHaveBeenCalledTimes(1);
    });

    it('api.off works', async () => {
        const lifecycle = createLifecycle();
        const beforemount = jest.fn();
        lifecycle.api.on('beforemount', beforemount);
        await lifecycle.mount();
        lifecycle.api.off('beforemount', beforemount);
        await lifecycle.mount();
        expect(beforemount).toHaveBeenCalledTimes(1);
    });
});
