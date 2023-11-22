import { delay } from '../../../spec/test-utils';
import { AppState } from '../../App';
import { createApp } from './utils';

describe.only(`start-interrupted`, () => {
    it(`start() interrupted before loading source code`, async () => {
        const app = createApp();
        const startingPromise = app.start();
        const stoppingPromise = app.stop();
        await Promise.resolve();

        await expect(startingPromise).rejects.toThrow(/interrupted/);
        await expect(stoppingPromise).resolves.toBeUndefined();
        expect(app.state).toBe(AppState.NOT_LOADED);
    });

    it(`start() interrupted before bootstrapping`, async () => {
        const app = createApp(
            {
                bootstrap: () => delay(200),
            },
            200
        );
        const startingPromise = app.start();
        await delay(100); // LOADING_SOURCE_CODE
        const stoppingPromise = app.stop();
        await startingPromise.catch(() => {});
        await stoppingPromise;
        expect(app.state).toBe(AppState.NOT_BOOTSTRAPPED); // state setup
        const restartingPromise = app.start();
        const restoppingPromise = app.stop();

        await expect(restartingPromise).rejects.toThrow(/interrupted/);
        await restoppingPromise;
        expect(app.state).toBe(AppState.NOT_BOOTSTRAPPED);
    });

    it(`start() interrupted before mounting`, async () => {
        const app = createApp({
            bootstrap: () => delay(200),
        });
        const startingPromise = app.start();
        await delay(100); // LOADING_SOURCE_CODE
        const stoppingPromise = app.stop();
        await startingPromise.catch(() => {});
        await stoppingPromise;
        expect(app.state).toBe(AppState.NOT_MOUNTED);

        const restartingPromise = app.start();
        const restoppingPromise = app.stop();
        await expect(restartingPromise).rejects.toThrow(/interrupted/);
        await restoppingPromise;
        expect(app.state).toBe(AppState.NOT_MOUNTED);
    });
});
