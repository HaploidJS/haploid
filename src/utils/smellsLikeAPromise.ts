// Respect to single-spa.

export function smellsLikeAPromise(promise: object): boolean {
    return (
        promise &&
        typeof Reflect.get(promise, 'then') === 'function' &&
        typeof Reflect.get(promise, 'catch') === 'function'
    );
}
