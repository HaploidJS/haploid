import { delay } from '../test-utils';
import { createApp } from './utils';
import { AppState } from '@/App';

describe.only(`update-rejects`, () => {
    it(`update() rejected if no update lifecycle defined`, async () => {
        const app = createApp({
            mount: (): Promise<void> => delay(0),
            unmount: (): Promise<void> => delay(0),
            bootstrap: (): Promise<void> => delay(0),
        });

        await app.start();

        await expect(app.update({})).rejects.toThrow(/has no update/);
    });

    it(`update() rejected if updating failed`, async () => {
        const app = createApp({
            update: () => Promise.reject(Error('mock error')),
        });

        await app.start();

        await expect(app.update({})).rejects.toThrow('mock error');
        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);
    });

    it(`update() cancelled if topTask is stop`, async () => {
        const app = createApp({
            update: () => delay(100),
        });

        await app.start();
        app.update({});
        await delay(50); // It must be in UPDATING state
        const updatingPromise = app.update({});
        app.stop();

        await expect(updatingPromise).rejects.toThrow(/cancelled/);
    });
});
