import { delay } from '../test-utils';
import { AppState, App } from '@/App';
import { LifecycleFns } from '@/Def';
import { createApp } from './utils';

describe.only(`happy-start`, () => {
    it(`traverse all bootstrap fns`, async () => {
        const fn = jest.fn();
        const app = createApp({
            bootstrap: [fn, fn],
        });
        await app.start();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it(`traverse all mount fns`, async () => {
        const fn = jest.fn();
        const app = createApp({
            mount: [fn, fn],
        });
        await app.start();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    // 🚶 Walk through start() logic

    it(`start() rejected after unload called()`, async () => {
        const app = createApp({});
        app.unload();
        await expect(app.start()).rejects.toThrow(`${app} cannot start if unload() called.`);
    });

    it(`start() waits for updating to finish up`, async () => {
        const update = jest.fn();
        const app = createApp({
            update: [(): Promise<void> => delay(100), update],
        });
        await app.start();
        app.update({});
        await delay(50); // It must be updating now.

        await app.start(); // Will wait for updating to finish up

        expect(update).toHaveBeenCalled(); // starting is fast, but still after updating finished
    });

    it(`start() waits for starting to finish up`, async () => {
        const mount = jest.fn();
        const app = createApp({
            mount: [(): Promise<void> => delay(100), mount],
        });
        app.start();
        await delay(50); // It must be starting now.

        await app.start(); // Will wait for starting to finish up

        expect(mount).toHaveBeenCalled(); // starting is fast, but still after previous starting finished
    });

    it(`start() waits for stopping to be interrupted`, async () => {
        const unmount = jest.fn();
        const app = createApp({
            unmount: [(): Promise<void> => delay(100), unmount],
        });
        await app.start();
        const stoppingPromise = app.stop(); // It must be going to stop now.

        await app.start(); // Will wait for stopping to be interrupted
        await expect(stoppingPromise).rejects.toThrow(/interrupted/);
        expect(unmount).not.toHaveBeenCalled(); // starting is fast, but still after stopping interrupted
    });

    it(`start() waits for stopping to finish up`, async () => {
        const unmount = jest.fn();
        const app = createApp({
            unmount: [(): Promise<void> => delay(100), unmount],
        });
        await app.start();
        const stoppingPromise = app.stop();
        await delay(50); // It must be stopping now.

        await app.start(); // Will wait for stopping to finish up
        await expect(stoppingPromise).resolves.toBeUndefined();
        expect(unmount).toHaveBeenCalled(); // starting is fast, but still after stopping finished
    });

    it(`start() resolved immediately when MOUNTED`, async () => {
        const afterStart = jest.fn();
        const app = createApp();

        await app.start(); // It must be in MOUNTED state
        app.start().then(afterStart);
        await Promise.resolve();
        expect(afterStart).toHaveBeenCalled();
    });

    it(`start() load/bootstrap/mount immediately when LOAD_ERROR`, async () => {
        let times = 0;

        const bootstrap = jest.fn();
        const mount = jest.fn();

        const app = new App({
            name: 'foo',
            maxLoadRetryTimes: 2,
            lifecycle: (): LifecycleFns<unknown> => {
                if (++times < 2) {
                    // @ts-ignore for test
                    return {};
                }

                return {
                    bootstrap,
                    mount,
                    unmount: async (): Promise<void> => {},
                };
            },
        });

        app.hooks.encounterLoadingSourceCodeFailure.tap('test', () => {
            return {
                retry: true,
                count: 1,
            };
        });

        await expect(app.start()).rejects.toThrow();
        expect(app.state).toBe(AppState.LOAD_ERROR);
        await expect(app.start()).resolves.toBeUndefined();
        expect(bootstrap).toHaveBeenCalled();
        expect(mount).toHaveBeenCalled();
    });

    it(`start() rejected immediately when SKIP_BECAUSE_BROKEN`, async () => {
        const afterStart = jest.fn();
        const app = createApp({
            mount: () => Promise.reject(Error('mock error')),
        });

        await app.start().catch(() => {}); // It must be in SKIP_BECAUSE_BROKEN state
        app.start().catch(afterStart);
        await Promise.resolve();
        expect(afterStart).toHaveBeenCalled();
    });

    it(`start() load/bootstrap/mount when NOT_LOADED`, async () => {
        const afterLoad = jest.fn();
        const afterBootstrap = jest.fn();
        const afterMount = jest.fn();
        const bootstrap = jest.fn();
        const mount = jest.fn();
        const app = createApp({
            bootstrap,
            mount,
        }); // It's in NOT_LOADED state
        app.on('afterload', afterLoad);
        app.lifecycle.on('afterbootstrap', afterBootstrap);
        app.lifecycle.on('aftermount', afterMount);
        expect(app.state).toBe(AppState.NOT_LOADED);
        await app.start();

        expect(afterLoad).toHaveBeenCalledTimes(1);
        expect(afterBootstrap).toHaveBeenCalledTimes(1);
        expect(afterMount).toHaveBeenCalledTimes(1);
        expect(bootstrap).toHaveBeenCalledTimes(1);
        expect(mount).toHaveBeenCalledTimes(1);
    });

    it(`start() bootstrap/mount when NOT_BOOTSTRAPPED`, async () => {
        const afterLoad = jest.fn();
        const afterBootstrap = jest.fn();
        const afterMount = jest.fn();
        const bootstrap = jest.fn();
        const mount = jest.fn();
        const app = createApp(
            {
                bootstrap,
                mount,
            },
            100
        );
        app.on('afterload', afterLoad);
        app.lifecycle.on('afterbootstrap', afterBootstrap);
        app.lifecycle.on('aftermount', afterMount);
        const startingPromise = app.start();
        await delay(50);
        app.stop();
        await startingPromise.catch(() => {});
        expect(app.state).toBe(AppState.NOT_BOOTSTRAPPED);
        await app.start();

        expect(afterLoad).toHaveBeenCalledTimes(1);
        expect(afterBootstrap).toHaveBeenCalledTimes(1);
        expect(afterMount).toHaveBeenCalledTimes(1);
        expect(bootstrap).toHaveBeenCalledTimes(1);
        expect(mount).toHaveBeenCalledTimes(1);
    });

    it(`start() mount when NOT_MOUTED`, async () => {
        const afterLoad = jest.fn();
        const afterBootstrap = jest.fn();
        const afterMount = jest.fn();
        const bootstrap = jest.fn();
        const mount = jest.fn();
        const app = createApp({
            bootstrap: [bootstrap, (): Promise<void> => delay(100)],
            mount,
        });
        app.on('afterload', afterLoad);
        app.lifecycle.on('afterbootstrap', afterBootstrap);
        app.lifecycle.on('aftermount', afterMount);
        const startingPromise = app.start();
        await delay(50);
        app.stop();
        await startingPromise.catch(() => {});
        expect(app.state).toBe(AppState.NOT_MOUNTED);
        await app.start();

        expect(afterLoad).toHaveBeenCalledTimes(1);
        expect(afterBootstrap).toHaveBeenCalledTimes(1);
        expect(afterMount).toHaveBeenCalledTimes(1);
        expect(bootstrap).toHaveBeenCalledTimes(1);
        expect(mount).toHaveBeenCalledTimes(1);
    });
});
