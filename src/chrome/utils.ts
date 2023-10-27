export const nativeWindow: Window & typeof globalThis = (0, eval)('window;');

export function summary(str: string, len = 50): string {
    const chars = Array.from(str);
    return chars.length > 50 ? `${chars.slice(0, len).join('')}...` : str;
}
