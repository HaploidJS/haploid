import { delay } from '../test-utils';
import { AppState, App } from '@/App';
import { createApp } from './utils';
import { LifecycleFns } from '@/Def';

const UPDATE_REJECT_ERROR = /cannot update/;

describe.only(`happy-update`, () => {
    it(`traverse all update fns`, async () => {
        const fn = jest.fn();
        const app = createApp({
            update: [fn, fn],
        });
        await app.start();
        await app.update({});
        expect(fn).toBeCalledTimes(2);
    });

    // 🚶 Walk through update() logic

    it(`update() rejected after unload called()`, async () => {
        const app = createApp({});
        app.unload();
        await expect(app.update({})).rejects.toThrow(`${app} cannot update if unload() called.`);
    });

    it(`update() waits for previous updating to be finished`, async () => {
        const afterUpdate = jest.fn();
        const app = createApp({
            update: (): Promise<void> => delay(100),
        });
        await app.start();
        app.update({}).then(afterUpdate);
        await delay(50);
        await app.update({});

        expect(afterUpdate).toBeCalled();
    });

    it(`update() waits for starting to be finished`, async () => {
        const afterStart = jest.fn();
        const app = createApp({
            mount: (): Promise<void> => delay(100),
            update: jest.fn(),
        });
        app.start().then(afterStart);
        await delay(50);
        await app.update({});

        expect(afterStart).toBeCalled();
    });

    it(`update() waits for stopping to be finished`, async () => {
        const afterStop = jest.fn();
        const app = createApp({
            unmount: (): Promise<void> => delay(100),
        });
        await app.start();
        app.stop().then(afterStop);
        await delay(50);
        await app.update({}).catch(() => {});

        expect(afterStop).toBeCalled();
    });

    it(`update() rejected when NOT_LOADED`, async () => {
        const app = createApp();
        expect(app.state).toBe(AppState.NOT_LOADED);

        await expect(app.update({})).rejects.toThrow(UPDATE_REJECT_ERROR);
    });

    it(`update() rejected when NOT_BOOTSTRAPPED`, async () => {
        const app = createApp({}, 100);
        const startingPromise = app.start().catch(() => {});
        await delay(50);
        await app.stop();
        await startingPromise;
        expect(app.state).toBe(AppState.NOT_BOOTSTRAPPED);

        await expect(app.update({})).rejects.toThrow(UPDATE_REJECT_ERROR);
    });

    it(`update() rejected when NOT_MOUNTED`, async () => {
        const app = createApp({
            bootstrap: async () => delay(100),
        });
        const startingPromise = app.start().catch(() => {});
        await delay(50);
        await app.stop();
        await startingPromise;
        expect(app.state).toBe(AppState.NOT_MOUNTED);

        await expect(app.update({})).rejects.toThrow(UPDATE_REJECT_ERROR);
    });

    it(`update() rejected when LOAD_ERROR`, async () => {
        const afterUpdate = jest.fn();
        const app = new App({
            name: 'foo',
            // @ts-ignore for test
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

        app.update({}).catch(afterUpdate);
        await Promise.resolve();
        expect(afterUpdate).toBeCalledTimes(1);
    });

    it(`update() rejected when SKIP_BECAUSE_BROKEN`, async () => {
        const app = createApp({
            bootstrap: () => Promise.reject(Error('mock error')),
        });
        await app.start().catch(() => {});
        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);

        await expect(app.update({})).rejects.toThrow(UPDATE_REJECT_ERROR);
    });
});
