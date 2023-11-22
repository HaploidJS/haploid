import { createLifecycle } from './utils';
import { Lifecycle } from '../../Lifecycle';

describe.only('fns', () => {
    it('default fns is null', async () => {
        const lifecycle = new Lifecycle({ name: 'foo' });
        expect(lifecycle.fns).toBeNull();
    });

    it('setFns works', async () => {
        const lifecycle = createLifecycle();
        const fns = {
            bootstrap: jest.fn(),
            mount: jest.fn(),
            unmount: jest.fn(),
            update: jest.fn(),
        };
        lifecycle.setFns(fns);
        expect(lifecycle.fns).toStrictEqual(fns);
    });

    it('setFns throws if mount missing', async () => {
        const lifecycle = createLifecycle();
        const fns = {
            unmount: jest.fn(),
        };
        // @ts-ignore test
        expect(() => lifecycle.setFns(fns)).toThrow();
    });

    it('setFns throws if unmount missing', async () => {
        const lifecycle = createLifecycle();
        const fns = {
            mount: jest.fn(),
        };
        // @ts-ignore test
        expect(() => lifecycle.setFns(fns)).toThrow();
    });

    it('setFns allows bootstrap missing', async () => {
        const lifecycle = createLifecycle();
        const fns = {
            mount: jest.fn(),
            unmount: jest.fn(),
            update: jest.fn(),
        };
        // @ts-ignore test
        expect(() => lifecycle.setFns(fns)).not.toThrow();
    });

    it('setFns allows update missing', async () => {
        const lifecycle = createLifecycle();
        const fns = {
            bootstrap: jest.fn(),
            mount: jest.fn(),
            unmount: jest.fn(),
        };
        // @ts-ignore test
        expect(() => lifecycle.setFns(fns)).not.toThrow();
    });
});
