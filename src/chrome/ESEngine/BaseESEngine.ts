import type { WindowShadow } from '../BOM/interfaces';
import { ScopedEvaluator } from './ScopedEvaluator';
import type { ESEngineOptions } from '../../Def';
import { Debugger } from '../../utils/Debugger';
import type { ScriptNode } from '../../node/';
import type { ESEngine } from './interfaces';

type ARGS = Parameters<ESEngine['execScript']>;

export type ExecHook = (...args: ARGS) => void;

export type ExecHooksPair = { before?: ExecHook; after?: ExecHook };

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
    public execScript<T = any>(
        script: ScriptNode,
        options?: {
            env?: Record<string, unknown>;
            scriptElement?: HTMLScriptElement;
        }
    ): Promise<T> | void {
        if (script.isESM) {
            const hooks = this.getExecESMHooks();
            try {
                hooks.forEach(hook => hook.before?.(script, options));
            } catch {
                // ignore
            }
            return this.execESMScript<T>(script).finally(() => {
                hooks.forEach(hook => hook.after?.(script, options));
            });
        } else {
            const hooks = this.getExecNonESMHooks();
            try {
                hooks.forEach(hook => hook.before?.(script, options));
            } catch {
                // ignore
            }
            try {
                this.execNonESMScript(script, options?.env);
            } finally {
                try {
                    hooks.forEach(hook => hook.after?.(script, options));
                } catch {
                    //ignore
                }
            }
        }
    }

    protected getExecESMHooks(): ExecHooksPair[] {
        return [];
    }

    protected getExecNonESMHooks(): ExecHooksPair[] {
        return [
            // "currentScript"
            {
                before: (script, options): void => {
                    Reflect.defineProperty(this.#windowShadow.node.document, 'currentScript', {
                        get() {
                            return options?.scriptElement;
                        },
                        configurable: true,
                        enumerable: true,
                    });
                },
                after: (): void => {
                    Reflect.defineProperty(this.#windowShadow.node.document, 'currentScript', {
                        get() {
                            return null;
                        },
                        configurable: true,
                        enumerable: true,
                    });
                },
            },
        ];
    }

    protected execNonESMScript(script: ScriptNode, env?: Record<string, unknown>): void {
        const { src, content } = script;
        this.debug('execNonESMScript(%o).', script);

        const code = this.fixSourceURL(content, src);
        try {
            this.scopedEvaluator.evaluate(code, env);
        } catch (e) {
            if (script.src)
                if (e instanceof Error) {
                    e.message = `${script.src || ''} ${e.message}`;
                    throw e;
                } else {
                    throw Error(`Evaluate error with ${script.src}.`);
                }
        }
    }

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
