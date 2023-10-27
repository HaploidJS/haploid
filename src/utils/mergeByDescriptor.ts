export function mergeByDescriptor(
    target: Record<PropertyKey, unknown>,
    ...sources: Array<Record<PropertyKey, unknown>>
): Record<PropertyKey, unknown> {
    for (const source of sources) {
        const keys = [...Object.getOwnPropertyNames(source), ...Object.getOwnPropertySymbols(source)];

        for (const key of keys) {
            const desc = Reflect.getOwnPropertyDescriptor(source, key);
            if (desc) {
                if (!Reflect.defineProperty(target, key, desc)) {
                    console.warn(`mergeByDescriptor ${String(key)} from`, source, 'to', target, 'failed.');
                }
            }
        }
    }

    return target;
}
