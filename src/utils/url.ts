export function toAbsolutePath(resolvePath: string | undefined, basePath?: string): undefined | string {
    if ('undefined' === typeof resolvePath) {
        return resolvePath;
    }

    try {
        return new URL(resolvePath, basePath || location.href).href;
    } catch (e) {
        console.warn(`Cannot convert ${resolvePath} to absolute based on ${basePath}.`);
        return resolvePath;
    }
}
