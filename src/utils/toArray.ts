export function toArray<T>(array: T | T[]): T[] {
    return Array.isArray(array) ? array : [array];
}
