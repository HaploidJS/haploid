// Fork from https://github.com/systemjs/systemjs/blob/main/src/extras/global.js

/* ######################################################################## */

// var global = 'undefined' !== typeof globalThis ? globalThis : window;

// safari unpredictably lists some new globals first or second in object order
var firstGlobalProp, secondGlobalProp, lastGlobalProp;
export function getGlobalProp(global) {
    var cnt = 0;
    var lastProp;
    for (var p in global) {
        // do not check frames cause it could be removed during import
        if (shouldSkipProperty(p, global))
            continue;
        if (cnt === 0 && p !== firstGlobalProp || cnt === 1 && p !== secondGlobalProp)
            return p;
        cnt++;
        lastProp = p;
    }
    if (lastProp !== lastGlobalProp)
        return lastProp;
}

export function noteGlobalProps(global) {
    // alternatively Object.keys(global).pop()
    // but this may be faster (pending benchmarks)
    firstGlobalProp = secondGlobalProp = undefined;
    for (var p in global) {
        // do not check frames cause it could be removed during import
        if (shouldSkipProperty(p, global))
            continue;
        if (!firstGlobalProp)
            firstGlobalProp = p;
        else if (!secondGlobalProp)
            secondGlobalProp = p;
        lastGlobalProp = p;
    }
    return lastGlobalProp;
}

var isIE11 = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Trident') !== -1;

function shouldSkipProperty(p, global) {
    return !global.hasOwnProperty(p)
        || ['dispatchEvent', 'addEventListener', 'removeEventListener', 'fetch', 'Request', 'Response', 'Headers'].includes(p) // for JSDOM
        || !isNaN(p) && p < global.length
        || isIE11 && global[p] && typeof window !== 'undefined' && global[p].parent === window;
}
