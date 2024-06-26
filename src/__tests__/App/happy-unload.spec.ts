import { delay } from '../../../spec/test-utils';
import { createApp } from './utils';
import { AppState } from '../../App';

describe.only(`happy-unload`, () => {
    it(`unmount and revert state`, async () => {
        const app = createApp({
            unmount: () => delay(100),
        });
        await app.start();
        const unloadingPromise = app.unload();
        await delay(50);

        expect(app.state).toBe(AppState.UNLOADING);
        await expect(unloadingPromise).resolves.toBeUndefined();
        expect(app.state).toBe(AppState.NOT_LOADED);
        expect(app.isUnloaded).toBe(true);
    });

    it(`ignore unmount failure`, async () => {
        const app = createApp({
            unmount: () => Promise.reject(Error('mock error')),
        });
        await app.start();

        await expect(app.unload()).resolves.toBeUndefined();
    });

    it(`traverse all unmount fns`, async () => {
        const fn = jest.fn();
        const app = createApp({
            unmount: [fn, fn],
        });
        await app.start();
        await app.unload();
        expect(fn).toHaveBeenCalledTimes(2);
    });

    // 🚶 Walk through unload() logic

    it(`unload() waits for updating to be finished`, async () => {
        const afterUpdate = jest.fn();
        const app = createApp({
            update: [(): Promise<void> => delay(100)],
        });
        await app.start();
        app.update({}).then(afterUpdate);
        await delay(50); // It must be updating now.

        await app.unload(); // Will wait for updating to be finished

        expect(afterUpdate).toHaveBeenCalled();
    });

    it(`unload() waits for starting to be finished`, async () => {
        const afterStart = jest.fn();
        const app = createApp({
            mount: (): Promise<void> => delay(100),
        });
        app.start().catch(afterStart);
        await delay(50);
        const unloadingPromise = app.unload(); // It must be going to unload now.

        await expect(unloadingPromise).resolves.toBeUndefined();
        expect(afterStart).not.toHaveBeenCalled(); // unloading is fast, but still after starting finished
    });

    it(`unload() waits for stopping to be finished`, async () => {
        const afterStop = jest.fn();
        const app = createApp({
            unmount: (): Promise<void> => delay(100),
        });
        await app.start();
        app.stop().catch(afterStop);
        await delay(50);
        const unloadingPromise = app.unload(); // It must be going to unload now.

        await expect(unloadingPromise).resolves.toBeUndefined();
        expect(afterStop).not.toHaveBeenCalled();
    });

    it(`unload() waits for unloading to be finished`, async () => {
        const afterUnload = jest.fn();
        const app = createApp({
            unmount: (): Promise<void> => delay(100),
        });
        await app.start();
        app.unload().catch(afterUnload);
        await delay(50);
        const unloadingPromise = app.unload(); // It must be going to unload now.

        await expect(unloadingPromise).resolves.toBeUndefined();
        expect(afterUnload).not.toHaveBeenCalled();
    });

    it(`unload() won't call unmount if alreay unmounted`, async () => {
        const afterUnload = jest.fn();
        const app = createApp({
            unmount: (): Promise<void> => afterUnload(),
        });
        await app.start();
        await app.stop();
        await app.unload();
        expect(afterUnload).toHaveBeenCalledTimes(1);
    });

    it(`unload() won't call unmount if not ever mounted`, async () => {
        const afterUnload = jest.fn();
        const app = createApp({
            unmount: (): Promise<void> => afterUnload(),
        });
        await app.unload();
        expect(afterUnload).toHaveBeenCalledTimes(0);
    });

    it(`unload() still call unmount if ever unmounted failed`, async () => {
        const afterUnload = jest.fn();
        const app = createApp({
            unmount: (): Promise<void> => {
                afterUnload();
                return Promise.reject();
            },
        });
        await app.start();
        await app.stop().catch(() => {});
        await app.unload();
        expect(afterUnload).toHaveBeenCalledTimes(2);
    });
});
