import { createPreloadPlugin } from '../../plugins/PreloadPlugin';
import { App } from '../../App';
import { LifecycleFns } from '../../Def';
import { baseDebugger } from '../../utils/Debugger';
import { delay } from '../../../spec/test-utils';

describe.only(`PreloadPlugin`, () => {
    it(`preloaded`, async () => {
        const app = new App({
            name: 'foo',
            preload: true,
            preloadDelay: 1e3,
            lifecycle: (): Promise<LifecycleFns<unknown>> =>
                new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            mount: jest.fn(),
                            unmount: jest.fn(),
                        });
                    }, 1e3);
                }),
        });

        createPreloadPlugin()({ app: app.api, debug: baseDebugger.extend('test:createPreloadPlugin') });

        await delay(2200); // > 1e3 + 1e3
        expect(app.lifecycle.fns).not.toBeNull();
        const beforeStart = Date.now();
        await app.start();
        expect(Date.now() - beforeStart).toBeLessThan(100); // fast start
    });
});
