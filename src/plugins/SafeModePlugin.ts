import { createInterruptedError } from '../AppError';
import type { AppPlugin } from '../Plugin';
import { AppDirective } from '../App';

declare module '../Def' {
    interface AppPluginOptions {
        /** Enable safe mode. */
        safe?: boolean;
    }
}

const PLUGIN_NAME = 'SafeModePlugin';
const ANYTHING_NOT_UNDEF = true;

export function createSafeModePlugin<AdditionalOptions, CustomProps>(): AppPlugin<AdditionalOptions, CustomProps> {
    return ({ app, debug }) => {
        app.hooks.waitForLoadingOrBootstrappingWhenStop.tap(PLUGIN_NAME, () => {
            return {
                wait: !!app.options.safe,
            };
        });

        if (app.options.safe) {
            return;
        }

        app.lifecycle.hooks.mount.tapPromise(PLUGIN_NAME, () => {
            debug('Unsafe but fast mount.');
            return app.lifecycle.fns
                .call('mount', app.lifecycle.customProps, false, (index: number, total: number): void => {
                    if (
                        (app.latestDirective === AppDirective.STOP || app.latestDirective === AppDirective.UNLOAD) &&
                        index < total - 1
                    ) {
                        throw createInterruptedError(`${app} mounting suspended.`);
                    }
                })
                .then(() => ANYTHING_NOT_UNDEF);
        });

        app.lifecycle.hooks.update.tapPromise(PLUGIN_NAME, ({ props: customProps }) => {
            debug('Unsafe but fast update.');
            return app.lifecycle.fns
                .call(
                    'update',
                    { ...app.lifecycle.customProps, ...customProps },
                    false,
                    (index: number, total: number) => {
                        if (
                            (app.latestDirective === AppDirective.STOP ||
                                app.latestDirective === AppDirective.UNLOAD) &&
                            index < total - 1
                        ) {
                            throw createInterruptedError(`${app} updating suspended.`);
                        }
                    }
                )
                .then(() => ANYTHING_NOT_UNDEF);
        });
    };
}
