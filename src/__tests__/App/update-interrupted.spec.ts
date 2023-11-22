import { createApp } from './utils';
import { AppState } from '../../App';

describe.only(`update-interrupted`, () => {
    it(`update() interrupted by stop() before updating`, async () => {
        const app = createApp();
        await app.start();
        expect(app.state).toBe(AppState.MOUNTED);

        const updatingPromise = app.update({});
        const stoppingPromise = app.stop();

        await expect(updatingPromise).rejects.toThrow(/interrupted/);
        await expect(stoppingPromise).resolves.toBeUndefined();
    });
});
