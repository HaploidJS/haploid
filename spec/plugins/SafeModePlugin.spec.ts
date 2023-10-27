import { createSafeModePlugin } from '@/plugins/SafeModePlugin';
import { baseDebugger } from '@/utils/Debugger';
import { LifecycleFns } from '@/Def';
import { App } from '@/App';
import { delay } from '../test-utils';

function createSafeModeApp<T = Record<never, never>>(...params: ConstructorParameters<typeof App<T>>): App<T> {
    const app = new App<T>(...params);
    createSafeModePlugin<T, Record<never, never>>()({
        app: app.api,
        debug: baseDebugger.extend('test:createSafeModePlugin'),
    });

    return app;
}

describe.only(`SafeModePlugin`, () => {
    describe('safe mode', () => {
        let app: App;
        afterEach(() => app?.unload());

        it(`stop() waits for loading to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: (): Promise<LifecycleFns<Record<never, never>>> =>
                    delay(100).then(() => ({
                        mount: jest.fn(),
                        unmount: jest.fn(),
                    })),
            });

            app.start().catch(() => {});
            await delay(0); // In loading.
            const start = performance.now();
            await app.stop();
            expect(performance.now() - start).toBeGreaterThan(95);
        });

        it(`stop() waits for bootstrapping to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: {
                    bootstrap: (): Promise<unknown> => delay(100),
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});
            await delay(0); // In bootstrapping.
            const start = performance.now();
            await app.stop();
            expect(performance.now() - start).toBeGreaterThan(95);
        });

        it(`unload() waits for loading to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: (): Promise<LifecycleFns<Record<never, never>>> =>
                    delay(100).then(() => ({
                        mount: jest.fn(),
                        unmount: jest.fn(),
                    })),
            });

            app.start().catch(() => {});
            await delay(0); // In loading.
            const start = performance.now();
            await app.unload();
            expect(performance.now() - start).toBeGreaterThan(95);
        });

        it(`unload() waits for bootstrapping to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: {
                    bootstrap: (): Promise<unknown> => delay(100),
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});
            await delay(0); // In bootstrapping.
            const start = performance.now();
            await app.unload();
            expect(performance.now() - start).toBeGreaterThan(95);
        });

        it(`mount fns cannot be suspended by stop`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: {
                    mount: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});

            await delay(50);
            await app.stop();

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it(`update fns cannot be suspended by stop`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: {
                    mount: jest.fn(),
                    update: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            await app.start();

            app.update({});
            await delay(50);
            await app.stop();

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it(`mount fns cannot be suspended by unload`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: {
                    mount: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});

            await delay(50);
            await app.unload();

            expect(fn).toHaveBeenCalledTimes(2);
        });

        it(`update fns cannot be suspended by unload`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: true,
                lifecycle: {
                    mount: jest.fn(),
                    update: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            await app.start();

            app.update({});
            await delay(50);
            await app.unload();

            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('unsafe mode', () => {
        let app: App;
        afterEach(() => app?.unload());

        it(`stop() doesn't wait for loading to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: (): Promise<LifecycleFns<Record<never, never>>> =>
                    delay(100).then(() => ({
                        mount: jest.fn(),
                        unmount: jest.fn(),
                    })),
            });

            app.start().catch(() => {});
            await delay(0); // In loading.
            const start = performance.now();
            await app.stop();
            expect(performance.now() - start).toBeLessThan(20);
        });

        it(`stop() doesn't wait for bootstrapping to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: {
                    bootstrap: (): Promise<unknown> => delay(100),
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});
            await delay(0); // In bootstrapping.
            const start = performance.now();
            await app.stop();
            expect(performance.now() - start).toBeLessThan(20);
        });

        it(`unload() still waits for loading to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: (): Promise<LifecycleFns<Record<never, never>>> =>
                    delay(100).then(() => ({
                        mount: jest.fn(),
                        unmount: jest.fn(),
                    })),
            });

            app.start().catch(() => {});
            await delay(0); // In loading.
            const start = performance.now();
            await app.unload();
            expect(performance.now() - start).toBeGreaterThan(95);
        });

        it(`unload() still waits for bootstrapping to finish up`, async () => {
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: {
                    bootstrap: (): Promise<unknown> => delay(100),
                    mount: jest.fn(),
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});
            await delay(0); // In bootstrapping.
            const start = performance.now();
            await app.unload();
            expect(performance.now() - start).toBeGreaterThan(90);
        });

        it(`mount fns can be suspended by unload`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: {
                    mount: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});

            await delay(50);
            await app.stop();

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it(`update fns can be suspended by unload`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: {
                    mount: jest.fn(),
                    update: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            await app.start();

            app.update({});
            await delay(50);
            await app.stop();

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it(`mount fns can be suspended by unload`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: {
                    mount: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            app.start().catch(() => {});

            await delay(50);
            await app.unload();

            expect(fn).toHaveBeenCalledTimes(1);
        });

        it(`update fns can be suspended by unload`, async () => {
            const fn = jest.fn();
            app = createSafeModeApp({
                name: 'foo',
                safe: false,
                lifecycle: {
                    mount: jest.fn(),
                    update: [fn, (): Promise<unknown> => delay(100), fn],
                    unmount: jest.fn(),
                },
            });

            await app.start();

            app.update({});
            await delay(50);
            await app.unload();

            expect(fn).toHaveBeenCalledTimes(1);
        });
    });
});
