export interface ESEngine {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execScript: <T = any>(code: string, src?: string) => T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execESMScript: <T = any>(code: string, src?: string) => Promise<T>;
    onDestroy: () => void;
}
