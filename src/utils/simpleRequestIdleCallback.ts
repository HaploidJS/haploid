export const simpleRequestIdleCallback = window.requestIdleCallback || ricd;
export const simpleCancelIdleCallback = window.cancelIdleCallback || cricd;

function ricd(...args: Parameters<typeof window.requestIdleCallback>): ReturnType<typeof window.requestIdleCallback> {
    return window.setTimeout(
        () =>
            args[0]({
                didTimeout: true,
                timeRemaining: () => 0,
            }),
        args[1]?.timeout
    );
}

function cricd(...args: Parameters<typeof window.cancelIdleCallback>): ReturnType<typeof window.cancelIdleCallback> {
    return window.cancelIdleCallback(...args);
}
