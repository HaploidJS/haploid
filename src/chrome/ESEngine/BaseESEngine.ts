import type { WindowShadow } from '../BOM/interfaces';
import { ScopedEvaluator } from './ScopedEvaluator';
import type { ESEngineOptions } from '../../Def';
import { Debugger } from '../../utils/Debugger';
import type { ScriptNode } from '../../node/';
import type { ESEngine } from './interfaces';

export abstract class BaseESEngine extends Debugger implements ESEngine {
    readonly #windowShadow: WindowShadow;
    readonly #options: ESEngineOptions;
    readonly #scopedEvaluator: ScopedEvaluator;

    constructor(windowShadow: WindowShadow, options: ESEngineOptions = {}) {
        super();
        this.#windowShadow = windowShadow;
        this.#options = options;

        this.#scopedEvaluator = new ScopedEvaluator({
            useStrict: options.useStrict,
            env: windowShadow.shadow,
            global: windowShadow.node,
        });
    }

    protected get scopedEvaluator(): ScopedEvaluator {
        return this.#scopedEvaluator;
    }

    public get windowShadow(): WindowShadow {
        return this.#windowShadow;
    }

    protected get options(): ESEngineOptions {
        return this.#options;
    }

    protected fixSourceURL(code: string, src?: string): string {
        const sourceURL = src && !src.match(/^\/\/# sourceURL=/m) ? `\n//# sourceURL=${src}\n` : '';
        return `${code}${sourceURL}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public execScript<T = any>(script: ScriptNode, onBefore?: () => any, onAfter?: () => any): Promise<T> | void {
        onBefore?.();

        let ret: Promise<T> | T;
        try {
            if (script.isESM) {
                ret = this.execESMScript<T>(script);
            } else {
                this.execNonESMScript(script);
                return;
            }
        } finally {
            onAfter?.();
        }

        return ret;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected abstract execNonESMScript(script: ScriptNode): void;

    // TODO support inline ESM
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected execESMScript<T = any>(script: ScriptNode): Promise<T> {
        const { src, content: code } = script;
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
