import { validateLifecycleFn } from '../../utils/validateLifecycleFn';

describe.only('validateLifecycleFn', () => {
    describe('bootstrap', () => {
        it('bootstrap can be undefined', async () => {
            expect(() =>
                validateLifecycleFn({
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).not.toThrowError();
        });

        it('bootstrap cannot be null', async () => {
            expect(() =>
                validateLifecycleFn({
                    bootstrap: null,
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });

        it('bootstrap cannot be empty array', async () => {
            expect(() =>
                validateLifecycleFn({
                    bootstrap: [],
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });

        it('bootstrap cannot be an array includes non-function', async () => {
            expect(() =>
                validateLifecycleFn({
                    bootstrap: [jest.fn(), 3],
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });
    });

    describe('update', () => {
        it('update can be undefined', async () => {
            expect(() =>
                validateLifecycleFn({
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).not.toThrowError();
        });

        it('update cannot be null', async () => {
            expect(() =>
                validateLifecycleFn({
                    update: null,
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });

        it('update cannot be empty array', async () => {
            expect(() =>
                validateLifecycleFn({
                    update: [],
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });

        it('update cannot be an array includes non-function', async () => {
            expect(() =>
                validateLifecycleFn({
                    update: [jest.fn(), 3],
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });
    });

    describe('mount', () => {
        it('mount cannot be empty array', async () => {
            expect(() =>
                validateLifecycleFn({
                    mount: [],
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });

        it('mount cannot be nullish', async () => {
            expect(() =>
                validateLifecycleFn({
                    unmount: jest.fn(),
                })
            ).toThrowError();

            expect(() =>
                validateLifecycleFn({
                    mount: null,
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });

        it('mount cannot be an array includes non-function', async () => {
            expect(() =>
                validateLifecycleFn({
                    mount: [jest.fn(), 3],
                    unmount: jest.fn(),
                })
            ).toThrowError();
        });
    });

    describe('unmount', () => {
        it('unmount cannot be empty array', async () => {
            expect(() =>
                validateLifecycleFn({
                    mount: jest.fn(),
                    unmount: [],
                })
            ).toThrowError();
        });

        it('unmount cannot be nullish', async () => {
            expect(() =>
                validateLifecycleFn({
                    mount: jest.fn(),
                })
            ).toThrowError();

            expect(() =>
                validateLifecycleFn({
                    mount: jest.fn(),
                    unmount: null,
                })
            ).toThrowError();
        });

        it('unmount cannot be an array includes non-function', async () => {
            expect(() =>
                validateLifecycleFn({
                    mount: jest.fn(),
                    unmount: [jest.fn(), 3],
                })
            ).toThrowError();
        });
    });
});
