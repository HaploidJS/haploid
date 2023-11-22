import { delay } from '../../../spec/test-utils';
import { AppState, App } from '../../App';
import { createApp } from './utils';
import { LifecycleFns } from '../../Def';

describe.only(`happy-stop`, () => {
    it(`traverse all unmount fns`, async () => {
        const fn = jest.fn();
        const app = createApp({
            unmount: [fn, fn],
        });
        await app.start();
        await app.stop();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    // 🚶 Walk through stop() logic

    it(`stop() rejected after unload called()`, async () => {
        const app = createApp({});
        app.unload();
        await expect(app.stop()).rejects.toThrow(`${app} cannot stop if unload() called.`);
    });

    it(`stop() waits for updating to finish up`, async () => {
        const afterUpdate = jest.fn();
        const app = createApp({
            update: [(): Promise<void> => delay(100)],
        });
        await app.start();
        app.update({}).then(afterUpdate);
        await delay(50); // It must be updating now.

        await app.stop(); // Will wait for updating to finish up

        expect(afterUpdate).toHaveBeenCalled();
    });

    it(`stop() resolved immediately when LOAD_ERROR`, async () => {
        const afterStop = jest.fn();
        const app = new App({
            name: 'foo',
            lifecycle: (): Promise<LifecycleFns<unknown>> => Promise.reject(Error('mock error')),
        });

        app.hooks.encounterLoadingSourceCodeFailure.tap('test', () => {
            return {
                retry: true,
                count: 1,
            };
        });

        await app.start().catch(jest.fn());
        expect(app.state).toBe(AppState.LOAD_ERROR);

        app.stop().then(afterStop);
        await Promise.resolve();
        expect(afterStop).toHaveBeenCalledTimes(1);
    });

    it(`stop() resolved immediately when SKIP_BECAUSE_BROKEN`, async () => {
        const afterStop = jest.fn();
        const app = createApp({
            mount: () => Promise.reject(Error('mock error')),
        });

        await app.start().catch(() => {}); // It must be in SKIP_BECAUSE_BROKEN state
        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);
        app.stop().then(afterStop);
        await Promise.resolve();
        expect(afterStop).toHaveBeenCalled();
    });

    it(`stop() resolved immediately when NOT_LOADED`, async () => {
        const afterStop = jest.fn();
        const app = createApp(); // It's in NOT_LOADED state
        expect(app.state).toBe(AppState.NOT_LOADED);
        app.stop().then(afterStop);
        await Promise.resolve();

        expect(afterStop).toHaveBeenCalled();
    });

    it(`stop() resolved immediately NOT_BOOTSTRAPPED`, async () => {
        const afterStop = jest.fn();
        const app = createApp({}, 100);
        const startingPromise = app.start();
        await delay(50);
        app.stop();
        await startingPromise.catch(() => {});
        expect(app.state).toBe(AppState.NOT_BOOTSTRAPPED);
        app.stop().then(afterStop);
        await Promise.resolve();

        expect(afterStop).toHaveBeenCalled();
    });

    it(`stop() resolved immediately when NOT_MOUTED`, async () => {
        const afterStop = jest.fn();
        const app = createApp({
            bootstrap: (): Promise<void> => delay(100),
        });
        const startingPromise = app.start();
        await delay(50);
        app.stop();
        await startingPromise.catch(() => {});
        expect(app.state).toBe(AppState.NOT_MOUNTED);
        app.stop().then(afterStop);
        await Promise.resolve();

        expect(afterStop).toHaveBeenCalled();
    });

    it(`stop() resolved immediately when LOADING_SOURCE_CODE`, async () => {
        const afterStop = jest.fn();
        const app = createApp({}, 200);
        app.start().catch(() => {});
        await delay(50);
        expect(app.state).toBe(AppState.LOADING_SOURCE_CODE);
        app.stop().then(afterStop);
        await Promise.resolve();

        expect(afterStop).toHaveBeenCalled();
    });

    it(`stop() resolved immediately when BOOTSTRAPPING`, async () => {
        const afterStop = jest.fn();
        const app = createApp({
            bootstrap: (): Promise<void> => delay(100),
        });
        app.start().catch(() => {});
        await delay(50);
        expect(app.state).toBe(AppState.BOOTSTRAPPING);
        app.stop().then(afterStop);
        await Promise.resolve();

        expect(afterStop).toHaveBeenCalled();
    });

    it(`stop() waits for starting to finish up`, async () => {
        const afterStart = jest.fn();
        const app = createApp({
            mount: (): Promise<void> => delay(100),
        });
        app.start().catch(afterStart);
        await delay(50);
        const stoppingPromise = app.stop(); // It must be going to stop now.

        await expect(stoppingPromise).resolves.toBeUndefined();
        expect(afterStart).not.toHaveBeenCalled(); // stopping is fast, but still after starting finished
    });
});
