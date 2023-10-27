import { createLifecycle } from './utils';

describe.only('custom-props', () => {
    it('support object', async () => {
        const customProps = { a: 1 };

        const lifecycle = createLifecycle(
            {},
            {
                customProps,
            }
        );

        expect(lifecycle.customProps).toBe(customProps);
    });

    it('support function', async () => {
        const customProps = jest.fn((): unknown => ({ a: 1 }));

        const lifecycle = createLifecycle(
            {},
            {
                customProps,
            }
        );

        expect(lifecycle.customProps).toEqual(customProps());
        expect(customProps).toHaveBeenNthCalledWith(1, lifecycle.name, window.location);
    });
});
