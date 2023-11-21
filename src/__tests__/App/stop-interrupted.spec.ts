import { AppState } from '@/App';
import { createApp } from './utils';

describe.only(`stop-interrupted`, () => {
    it(`stop() interrupted by start() before unmounting`, async () => {
        const app = createApp();
        await app.start();
        const stoppingPromise = app.stop();

        const startingPromise = app.start(); // interrupt stopping
        await expect(stoppingPromise).rejects.toThrow(/interrupted/);
        expect(app.state).toBe(AppState.MOUNTED);
        await expect(startingPromise).resolves.toBeUndefined();
    });

    it(`stop() interrupted by update() before unmounting`, async () => {
        const app = createApp({
            update: jest.fn(),
        });
        await app.start();
        const stoppingPromise = app.stop();

        const updatingPromise = app.update({}); // interrupt stopping
        await expect(stoppingPromise).rejects.toThrow(/interrupted/);
        expect(app.state).toBe(AppState.MOUNTED);
        await expect(updatingPromise).resolves.toBeUndefined();
    });
});
