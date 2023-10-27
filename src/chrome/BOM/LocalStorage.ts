import { NodeProxy } from './NodeProxy';

export class LocalStorageNode extends NodeProxy<typeof localStorage> {
    constructor(name: string) {
        super(name, localStorage, {});
    }

    protected getBuiltInShadow(): Record<string, unknown> {
        const KEY_PREFIX = `${this.name}:`;
        const getLen = (): number => {
            let len = 0;

            for (let i = localStorage.length - 1; i >= 0; i -= 1) {
                if (localStorage.key(i)?.startsWith(KEY_PREFIX)) len += 1;
            }

            return len;
        };

        const clear = (): void => {
            const keysToRemove: string[] = [];

            for (let i = localStorage.length - 1; i >= 0; i -= 1) {
                const key = localStorage.key(i);
                if (key?.startsWith(KEY_PREFIX)) keysToRemove.push(key);
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
        };

        const key = (idx: number): ReturnType<typeof localStorage.key> => {
            let fidx = -1;
            for (let i = 0; i < localStorage.length; i += 1) {
                const key = localStorage.key(i);
                if (key?.startsWith(KEY_PREFIX)) {
                    fidx += 1;
                    if (idx === fidx) return key.replace(KEY_PREFIX, '');
                }
            }

            return null;
        };

        return {
            get length(): number {
                return getLen();
            },
            clear,
            key,
            getItem(key: string): ReturnType<typeof localStorage.getItem> {
                return localStorage.getItem(KEY_PREFIX + key);
            },
            setItem(key: string, val: string): ReturnType<typeof localStorage.setItem> {
                return localStorage.setItem(KEY_PREFIX + key, val);
            },
            removeItem(key: string): ReturnType<typeof localStorage.removeItem> {
                return localStorage.removeItem(KEY_PREFIX + key);
            },
        };
    }

    protected beforeDefineProperty(): void {}
    protected afterDefineProperty(): void {}
    protected beforeDeleteProperty(): void {}
    protected afterDeleteProperty(): void {}
    protected beforeSet(): void {}
    protected afterSet(): void {}
    public onDestroy(): void {}
    public onLoad(): void {}
    public onLoading(): void {}

    protected get debugName(): string {
        return `localstorage:${this.name}`;
    }
}
