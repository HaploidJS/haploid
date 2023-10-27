import type { LifecycleFns } from '../Def';

export function validateLifecycleFn(lifecycle: {
    [key in keyof LifecycleFns<unknown>]?: unknown;
}): void {
    const { bootstrap, mount, unmount, update } = lifecycle ?? {};

    const isFnOrFnarray = (fn: unknown): boolean => {
        return (
            'function' === typeof fn || (Array.isArray(fn) && fn.length > 0 && fn.every(fn => 'function' === typeof fn))
        );
    };

    if (!('undefined' === typeof bootstrap || isFnOrFnarray(bootstrap))) {
        throw Error(`bootstrap is invalid lifecycle function.`);
    }

    if (!('undefined' === typeof update || isFnOrFnarray(update))) {
        throw Error(`update is invalid lifecycle function.`);
    }

    if (!isFnOrFnarray(mount)) {
        throw Error(`mount is invalid lifecycle function.`);
    }

    if (!isFnOrFnarray(unmount)) {
        throw Error(`unmount is invalid lifecycle function.`);
    }
}
