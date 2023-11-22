import { createIgnoreUnmountFailurePlugin } from '../../plugins/IgnoreUnmountFailurePlugin';
import { baseDebugger } from '../../utils/Debugger';
import { App } from '../../App';

describe.only(`IgnoreUnmountFailurePlugin`, () => {
    it(`unmount error ignored`, async () => {
        const app = new App<unknown, unknown>({
            name: 'foo',
            lifecycle: {
                unmount: (): Promise<void> => Promise.reject(Error('mock error')),
                mount: (): Promise<void> => Promise.resolve(),
            },
            ignoreUnmountFailure: true,
        });

        createIgnoreUnmountFailurePlugin()({
            app: app.api,
            debug: baseDebugger.extend('test:createIgnoreUnmountFailurePlugin'),
        });

        await app.start();
        await expect(app.stop()).resolves.toBeUndefined();
    });
});
