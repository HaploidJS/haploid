function ensureAvaliableKey(): string {
    const skey = '__HAPLOID_MAP__';
    let key = skey;
    let i = 0;
    while (key in window) {
        key = `${skey}${i++}__`;
    }

    return key;
}

let globalMapKey: keyof Window;

function ensureMapRoot(): void {
    const MAP_KEY = globalMapKey || (globalMapKey = ensureAvaliableKey() as keyof Window);

    if (!(MAP_KEY in window)) {
        Object.defineProperty(window, MAP_KEY, {
            value: new Map<PropertyKey, Map<unknown, unknown>>(),
            enumerable: false,
            writable: false,
            configurable: false,
        });
    }
}

export function ensureGlobalMap<K, T>(name: PropertyKey): Map<K, T> {
    ensureMapRoot();

    if (!window[globalMapKey].has(name)) {
        window[globalMapKey].set(name, new Map<K, T>());
    }

    return window[globalMapKey].get(name) as Map<K, T>;
}

export function ensureGlobalWeakMap<K extends object, T>(name: PropertyKey): WeakMap<K, T> {
    ensureMapRoot();

    if (!window[globalMapKey].has(name)) {
        window[globalMapKey].set(name, new WeakMap<K, T>());
    }

    return window[globalMapKey].get(name) as WeakMap<K, T>;
}
