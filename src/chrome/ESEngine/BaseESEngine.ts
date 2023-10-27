import type { WindowShadow } from '../BOM/interfaces';
import type { ESEngineOptions } from '../../Def';
import { Debugger } from '../../utils/Debugger';
import type { ESEngine } from './interfaces';

export abstract class BaseESEngine extends Debugger implements ESEngine {
    readonly #windowShadow: WindowShadow;
    readonly #options: ESEngineOptions;

    constructor(windowShadow: WindowShadow, options: ESEngineOptions = {}) {
        super();
        this.#windowShadow = windowShadow;
        this.#options = options;
    }

    protected get windowShadow(): WindowShadow {
        return this.#windowShadow;
    }

    protected get options(): ESEngineOptions {
        return this.#options;
    }

    protected get useStrict(): boolean {
        return !(this.#options.useStrict === false);
    }

    protected fixSourceURL(code: string, src?: string): string {
        const sourceURL = src && !src.match(/^\/\/# sourceURL=/m) ? `\n//# sourceURL=${src}\n` : '';
        return `${code}${sourceURL}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public abstract execScript<T = any>(code: string, src?: string): T;

    // TODO support inline ESM
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public execESMScript<T = any>(code: string, src?: string): Promise<T> {
        if (src) {
            return import(/* @vite-ignore */ /* webpackIgnore: true */ src) as Promise<T>;
        } else {
            const uri = URL.createObjectURL
                ? URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
                : `data:text/javascript;charset=utf-8,${encodeURIComponent(code)}`;
            return import(/* @vite-ignore */ /* webpackIgnore: true */ uri) as Promise<T>;
        }
    }

    public onDestroy(): void {}
}
