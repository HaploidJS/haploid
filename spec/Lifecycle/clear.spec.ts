import { createLifecycle } from './utils';

describe.only('clear', () => {
    it('clear fns', async () => {
        const lifecycle = createLifecycle();

        lifecycle.clear();

        expect(lifecycle.fns).toBeNull();
    });

    it('clear events', async () => {
        const lifecycle = createLifecycle();

        const beforemount = jest.fn();

        lifecycle.on('beforemount', beforemount);

        lifecycle.clear();

        await lifecycle.mount().catch(e => e);

        expect(beforemount).not.toHaveBeenCalled();
    });
});
