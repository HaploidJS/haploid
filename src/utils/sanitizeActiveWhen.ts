// Respect to single-spa.

import { Activity, ActivityFn, AppLocation } from '../Def';

function toDynamicPathValidatorRegex(path: string, exactMatch = false): RegExp {
    let lastIndex = 0,
        inDynamic = false,
        regexStr = '^';

    // 🔥 Breaking change, do not prefix with '/' when starts with '#'
    // Consider ? later
    if (path[0] !== '/' && path[0] !== '#') {
        path = `/${path}`;
    }

    for (let charIndex = 0; charIndex < path.length; charIndex++) {
        const char = path[charIndex];
        const startOfDynamic = !inDynamic && char === ':';
        const endOfDynamic = inDynamic && char === '/';
        if (startOfDynamic || endOfDynamic) {
            appendToRegex(charIndex);
        }
    }

    appendToRegex(path.length);
    return new RegExp(regexStr, 'i');

    function appendToRegex(index: number): void {
        const anyCharMaybeTrailingSlashRegex = '[^/]+/?';
        const commonStringSubPath = escapeStrRegex(path.slice(lastIndex, index));

        regexStr += inDynamic ? anyCharMaybeTrailingSlashRegex : commonStringSubPath;

        if (index === path.length) {
            if (inDynamic) {
                if (exactMatch) {
                    // Ensure exact match paths that end in a dynamic portion don't match
                    // urls with characters after a slash after the dynamic portion.
                    regexStr += '$';
                }
            } else {
                // For exact matches, expect no more characters. Otherwise, allow
                // any characters.
                const suffix = exactMatch ? '' : '.*';

                regexStr =
                    // use charAt instead as we could not use es6 method endsWith
                    regexStr.charAt(regexStr.length - 1) === '/'
                        ? `${regexStr}${suffix}$`
                        : `${regexStr}(/${suffix})?(#.*)?$`;
            }
        }

        inDynamic = !inDynamic;
        lastIndex = index;
    }

    function escapeStrRegex(str: string): string {
        // borrowed from https://github.com/sindresorhus/escape-string-regexp/blob/master/index.js
        return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    }
}

export function pathToActiveWhen(path: string, exactMatch = false): ActivityFn {
    const regex = toDynamicPathValidatorRegex(path, exactMatch);

    return (location: AppLocation) => {
        // 🔥 Breaking change: if path starts with a '#', we test it with hash only
        if (path.startsWith('#')) return regex.test(location.hash);
        const origin = location.origin;
        const route = location.href.replace(origin, '').replace(location.search, '').split('?')[0];
        return regex.test(route);
    };
}

export function sanitizeActiveWhen(activeWhen: Activity): ActivityFn {
    const activeWhenArray = Array.isArray(activeWhen) ? activeWhen : [activeWhen];
    const activeWhenArrayFn = activeWhenArray.map(activeWhenOrPath =>
        typeof activeWhenOrPath === 'function' ? activeWhenOrPath : pathToActiveWhen(activeWhenOrPath)
    );

    return location => activeWhenArrayFn.some(activeWhen => activeWhen(location));
}
