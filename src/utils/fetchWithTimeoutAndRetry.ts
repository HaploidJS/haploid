import pRetry, { AbortError } from 'p-retry';
import { baseDebugger } from './Debugger';

const debug = baseDebugger.extend('fetchWithTimeoutAndRetry');

export async function fetchWithTimeoutAndRetry(
    src: string,
    requestOptions?: RequestInit,
    timeout?: number,
    retries?: number
): Promise<Response> {
    const controller: AbortController | null = 'undefined' === typeof AbortController ? null : new AbortController();

    let abortTimeout: ReturnType<typeof setTimeout>;

    if ('number' === typeof timeout && timeout > 0) {
        abortTimeout = setTimeout(() => {
            controller?.abort(`Fetching ${src} exceeds ${timeout}ms.`);
        }, timeout);
    }

    const retryPromise = (): Promise<Response> =>
        pRetry<Response>(
            () =>
                fetch(src, {
                    method: 'GET',
                    cache: 'no-store',
                    redirect: 'follow',
                    ...requestOptions,
                }).then(response => {
                    if (!response) throw Error(`Fetching ${src} is blocked`);
                    // 4xx means the resource itself has problem(s),
                    // don't need to retry
                    if (response.status < 500 && response.status >= 400) {
                        throw new AbortError(response.statusText);
                    }

                    if (response.status < 200 || response.status >= 300) {
                        throw Error(response.statusText);
                    }

                    return response;
                }),
            {
                onFailedAttempt: (err): void => debug('Retry onFailedAttempt: %O.', err),
                retries: retries ?? 0, // Don't retry by default
            }
        );

    return new Promise((resolve, reject) => {
        const onAbort = (): void => reject(Error(controller?.signal.reason));
        controller?.signal.addEventListener('abort', onAbort);
        retryPromise()
            .then(resolve, reject)
            .finally(() => {
                clearTimeout(abortTimeout);
                controller?.signal.removeEventListener('abort', onAbort);
            });
    });
}
