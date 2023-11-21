import { delay } from '../../../spec/test-utils';
import { createApp } from './utils';

describe.only(`stop-rejects`, () => {
    it(`stop() resolved if ignoreUnmountFailure=true even no unmount lifecycle defined`, async () => {
        const app = createApp({
            mount: (): Promise<void> => Promise.resolve(),
            unmount: (): Promise<void> => Promise.reject(Error('mock error')),
        });

        app.hooks.encounterUnmountFailure.tap('test', () => {
            return {
                ignore: true,
            };
        });

        await app.start();

        await expect(app.stop()).resolves.toBeUndefined();
    });

    it(`stop() rejected if unmounting failed`, async () => {
        const app = createApp({
            unmount: () => Promise.reject(Error('mock error')),
        });

        await app.start();

        await expect(app.stop()).rejects.toThrow('mock error');
        // next stop() will never throw again
        await expect(app.stop()).resolves.toBeUndefined();
    });

    it(`stop() resolved if ignoreUnmountFailure=true even unmounting failed`, async () => {
        const app = createApp({
            unmount: (): Promise<void> => Promise.reject(Error('mock error')),
            mount: (): Promise<void> => Promise.resolve(),
        });

        app.hooks.encounterUnmountFailure.tap('test', () => {
            return {
                ignore: true,
            };
        });

        await app.start();

        await expect(app.stop()).resolves.toBeUndefined();
    });

    it(`stop() cancelled if topTask is start`, async () => {
        const app = createApp({
            update: () => delay(100),
        });

        await app.start();
        app.update({});
        const stoppingPromise = app.stop();
        app.update({});

        await expect(stoppingPromise).rejects.toThrow(/cancelled/);
    });
});
