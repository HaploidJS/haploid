export function createUniversalFactory<Instance extends { version: number }, T = void, S = void>(
    globalKey: keyof Window,
    factory: (t: T, s: S) => Instance,
    version: number,
    allowConflict?: boolean
): (t: T, s: S) => Instance {
    let localInstance: Instance;
    return (t: T, s: S): Instance => {
        const descriptor = Reflect.getOwnPropertyDescriptor(window, globalKey);

        if (descriptor) {
            let val: Instance | undefined = undefined;
            let cannotGetV = false;

            if ('value' in descriptor) {
                val = descriptor.value;
            } else if (descriptor.get) {
                val = descriptor.get();
            } else {
                cannotGetV = true;
            }

            if (!cannotGetV && val?.version === version) {
                return val;
            }

            if (allowConflict) {
                if (!localInstance) {
                    localInstance = factory(t, s);
                }
                console.warn(`Create a new instance named ${globalKey} in conflict with the existing one.`);
                return localInstance;
            } else {
                throw Error(`Version(${version}) in conflict with global.${globalKey}.`);
            }
        }

        const globalInstance = factory(t, s);

        Object.defineProperty(window, globalKey, {
            value: globalInstance,
            configurable: false,
            writable: false,
            enumerable: false,
        });

        return globalInstance;
    };
}
