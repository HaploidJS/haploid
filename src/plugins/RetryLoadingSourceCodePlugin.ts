import type { AppPlugin } from '../Plugin';

declare module '../Def' {
    interface AppPluginOptions {
        /** Max retry times if loading encounters any error, default is 2. */
        maxLoadRetryTimes?: number;
        /** Being greater than loadRetryTimeout will reset count of retry. */
        loadRetryTimeout?: number;
    }
}

const DEFAULT_MAX_LOAD_RETRY_TIMES = 2;
const DEFAULT_RETRY_AFTER = 6000;

export function createRetryLoadingSourceCodePlugin<AdditionalOptions, CustomProps>(): AppPlugin<
    AdditionalOptions,
    CustomProps
> {
    return ({ app }) => {
        let loadRetryCount = 0;
        let lastTime = 0;

        // No NaN, greater than DEFAULT_MAX_LOAD_RETRY_TIMES(default).
        const maxLoadRetryTimes: number = Math.max(
            DEFAULT_MAX_LOAD_RETRY_TIMES,
            parseInt((app.options.maxLoadRetryTimes ?? 0).toString(), 10) || DEFAULT_MAX_LOAD_RETRY_TIMES
        );

        // No NaN, default to DEFAULT_RETRY_AFTER if not set, or 0 if less than 0.
        const retryTimeout = Math.max(
            0,
            parseInt((app.options.loadRetryTimeout ?? 0).toString(), 10) || DEFAULT_RETRY_AFTER
        );

        app.hooks.encounterLoadingSourceCodeFailure.tap('RetryLoadingSourceCodePlugin', () => {
            const now = Date.now();
            const duration = now - lastTime;
            lastTime = now;

            // If duration from this failure to last one is more than retryTimeout, reset loadRetryCount to 0.
            if (retryTimeout > 0 && duration > retryTimeout) {
                // "duration" from now to last failure is greater than "retryTimeout",
                // we reset loadRetryCount to 0
                loadRetryCount = 0;
            }

            if (++loadRetryCount < maxLoadRetryTimes) {
                return { retry: true, count: loadRetryCount };
            }
        });
    };
}
