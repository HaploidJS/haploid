import type { AppPlugin } from '../Plugin';

declare module '../Def' {
    interface AppPluginOptions {
        /** If ignore failure when unmounting. */
        ignoreUnmountFailure?: boolean;
    }
}

export function createIgnoreUnmountFailurePlugin<AdditionalOptions, CustomProps>(): AppPlugin<
    AdditionalOptions,
    CustomProps
> {
    return ({ app, debug }) => {
        if (app.options.ignoreUnmountFailure) {
            debug('Ignore unmount failure.');
            app.hooks.encounterUnmountFailure.tap('IgnoreUnmountFailurePlugin', () => ({ ignore: true }));
        }
    };
}
