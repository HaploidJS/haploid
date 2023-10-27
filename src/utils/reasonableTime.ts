// Respect to single-spa.

export function reasonableTime<T>(promise: Promise<T>, timeout: number, timeoutMessage?: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        promise.then(resolve, reject);

        if (timeout > 0) {
            setTimeout(() => {
                reject(Error(timeoutMessage?.replace(/%d/g, timeout.toString()) || `Promise timeout of ${timeout}ms.`));
            }, timeout);
        } else {
            console.warn(timeout, ` is not a valid timeout for reasonableTime.`);
        }
    });
}
