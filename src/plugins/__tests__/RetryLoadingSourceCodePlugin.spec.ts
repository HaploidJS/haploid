import { createRetryLoadingSourceCodePlugin } from '../../plugins/RetryLoadingSourceCodePlugin';
import { baseDebugger } from '../../utils/Debugger';
import { App, AppState } from '../../App';
import { LifecycleFns } from '../../Def';
import { delay } from '../../../spec/test-utils';

describe.only(`RetryLoadingSourceCodePlugin`, () => {
    it('respect maxLoadRetryTimes', async () => {
        const app = new App({
            name: 'foo',
            lifecycle: (): Promise<LifecycleFns<unknown>> => Promise.reject(Error('mock error')),
            maxLoadRetryTimes: 3,
        });

        createRetryLoadingSourceCodePlugin()({
            app: app.api,
            debug: baseDebugger.extend('test:RetryLoadingSourceCodePlugin'),
        });

        await expect(app.start()).rejects.toThrow('mock error');
        expect(app.state).toBe(AppState.LOAD_ERROR);
        await expect(app.start()).rejects.toThrow('mock error');
        expect(app.state).toBe(AppState.LOAD_ERROR);
        // The third time of loading failed makes SKIP_BECAUSE_BROKEN
        await expect(app.start()).rejects.toThrow('mock error');
        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);
    });

    it('respect loadRetryTimeout', async () => {
        const app = new App({
            name: 'foo',
            lifecycle: (): Promise<LifecycleFns<unknown>> => Promise.reject(Error('mock error')),
            maxLoadRetryTimes: 3,
            loadRetryTimeout: 200,
        });

        createRetryLoadingSourceCodePlugin()({
            app: app.api,
            debug: baseDebugger.extend('test:RetryLoadingSourceCodePlugin'),
        });

        await app.start().catch(() => {});
        await app.start().catch(() => {});
        expect(app.state).toBe(AppState.LOAD_ERROR);

        await delay(210); // > 200

        await app.start().catch(() => {}); // count = 1

        await delay(190); // < 200
        await app.start().catch(() => {}); // count = 2
        expect(app.state).toBe(AppState.LOAD_ERROR);

        await delay(190); // < 200
        await app.start().catch(() => {}); // count = 3

        expect(app.state).toBe(AppState.SKIP_BECAUSE_BROKEN);
    });
});
