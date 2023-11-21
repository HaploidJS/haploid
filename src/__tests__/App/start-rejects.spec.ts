import { delay } from '../../../spec/test-utils';
import { createApp } from './utils';
import { AppState, App } from '@/App';
import { LifecycleFns } from '@/Def';

describe.only(`start-rejects`, () => {
    it(`start() rejected if bootstrap lifecycle not defined`, async () => {
        const app = createApp({
            mount: [],
            unmount: [],
        });

        await expect(app.start()).rejects.toThrow(/invalid lifecycle/);
    });

    it(`start() rejected if mount lifecycle not defined`, async () => {
        const app = createApp({
            mount: [],
            unmount: [],
        });

        await expect(app.start()).rejects.toThrow(/invalid lifecycle/);
    });

    it(`start() rejected if unmount lifecycle not defined`, async () => {
        const app = createApp({
            mount: jest.fn(),
            unmount: [],
        });

        await expect(app.start()).rejects.toThrow(/invalid lifecycle/);
    });

    it(`start() rejected if loading source code failed`, async () => {
        const app = new App({
            name: 'foo',
            lifecycle: (): Promise<LifecycleFns<unknown>> => Promise.reject(Error('mock error')),
        });

        await expect(app.start()).rejects.toThrow('mock error');
        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);
    });

    it(`start() rejected if bootstrapping failed`, async () => {
        const app = createApp({
            bootstrap: () => Promise.reject(Error('mock error')),
        });

        await expect(app.start()).rejects.toThrow('mock error');
        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);
    });

    it(`start() rejected if mounting failed`, async () => {
        const app = createApp({
            mount: () => Promise.reject(Error('mock error')),
        });

        await expect(app.start()).rejects.toThrow('mock error');
        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);
    });

    it(`start() rejected if state=SKIP_BECAUSE_BROKEN`, async () => {
        const app = createApp({
            bootstrap: () => Promise.reject(Error('mock error')),
        });

        await expect(app.start()).rejects.toThrow('mock error');

        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);

        await expect(app.start()).rejects.toThrow('App(foo) cannot start when broken.');
    });

    it(`start() failed will call unmount`, async () => {
        const unmount = jest.fn();
        const app = createApp({
            mount: [(): Promise<void> => delay(100), (): Promise<void> => Promise.reject(Error('mock error'))],
            unmount,
        });

        app.start().catch(() => {});
        await delay(150);
        app.stop();

        expect(unmount).toHaveBeenCalled();
    });

    it(`start() cancelled if topTask is stop`, async () => {
        const app = createApp({
            update: () => delay(100),
        });

        await app.start();
        app.update({});
        await delay(50); // It must be in UPDATING state
        const startingPromise = app.start();
        app.stop();

        await expect(startingPromise).rejects.toThrow(/cancelled/);
    });

    it(`start() rejected if lifecycle timeout`, async () => {
        const app = new App<Record<never, never>>({
            name: 'foo',
            lifecycle: delay(400).then(() => ({
                mount: jest.fn(),
                unmount: jest.fn(),
            })),
            timeouts: {
                load: 200,
            },
        });

        await expect(app.start()).rejects.toThrow(/timeout/);
    });
});
