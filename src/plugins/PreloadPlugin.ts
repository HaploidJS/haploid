import debounce from 'lodash/debounce';
import type { AppPlugin } from '../Plugin';
import { simpleRequestIdleCallback, simpleCancelIdleCallback } from '../utils/simpleRequestIdleCallback';

declare module '../Def' {
    interface AppPluginOptions {
        /** Enable preload. */
        preload?: boolean;
        /** Delay before preload starts. */
        preloadDelay?: number;
    }
}

export function createPreloadPlugin<AdditionalOptions, CustomProps>(): AppPlugin<AdditionalOptions, CustomProps> {
    return ({ app, debug }) => {
        let ric = 0;
        let startCalled = false;

        const onAfterStop = debounce(
            () => {
                app.off('afterstop', onAfterStop);
                ric = simpleRequestIdleCallback(() => {
                    if (!startCalled) {
                        debug('Preload %s.', app.name);
                        app.load().catch(err => {
                            debug('Preload %s failed: %O.', app.name, err);
                        });
                    }
                });
            },
            Math.max(0, app.options.preloadDelay ?? 0) || 5000,
            { leading: false }
        );

        if (app.options.preload) {
            app.once('beforestart', () => {
                startCalled = true;
                app.off('afterstop', onAfterStop);
            }).on('afterstop', onAfterStop);

            app.hooks.afterunload.tap('PreloadPlugin', () => {
                simpleCancelIdleCallback(ric);
            });

            onAfterStop();
        }
    };
}
