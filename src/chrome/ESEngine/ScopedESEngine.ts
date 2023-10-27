import { BaseESEngine } from './BaseESEngine';
import { hasOwn } from '../../utils/hasOwn';
import { nativeWindow, summary } from '../utils';

interface NestedContext {
    eval: <T = unknown>(code: string) => T;
    get: <T = unknown>(variable: string) => T;
}

function findAvaliableKey(prefix: string): string {
    let gindex = 0;
    do {
        gindex += 1;
    } while (hasOwn(nativeWindow, `${prefix}${gindex}`));

    return `${prefix}${gindex}`;
}

export class ScopedESEngine extends BaseESEngine {
    #nestedContext: NestedContext | null = null;

    readonly #ENV_KEY: string = findAvaliableKey('__HAPLOID_EVAL_ENV__$');
    readonly #CTX_KEY: string = findAvaliableKey('__HAPLOID_EVAL_CTX__$');

    readonly #envMap: Record<string, unknown> = Object.create(null);

    constructor(...args: ConstructorParameters<typeof BaseESEngine>) {
        super(...args);

        Reflect.defineProperty(nativeWindow, this.#ENV_KEY, {
            get: () => {
                return this.#envMap;
            },
            enumerable: false,
            configurable: true,
        });

        Reflect.defineProperty(nativeWindow, this.#CTX_KEY, {
            get: () => {
                return this.windowShadow.node;
            },
            enumerable: false,
            configurable: true,
        });
    }

    protected get debugName(): string {
        return 'chrome:ScopedESEngine';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public override execESMScript<T = any>(code: string, src?: string): Promise<T> {
        console.warn(`ESM cannot be evaluated in sandbox temporarily.`);
        return super.execESMScript(code, src);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public override execScript<T = any>(code: string, src?: string): T {
        this.debug('execScript(%s, %s).', summary(code), src);
        code = this.fixSourceURL(code, src);
        return this.#createScopedEval().eval(code);
    }

    public override onDestroy(): void {
        // Attention: NEVER delete ENV_KEY/CTX_KEY from global.
        super.onDestroy();
    }

    #preNames: string[] = [];

    #patchEnv(env: Record<string, unknown>): string[] {
        const envKeys = Object.getOwnPropertyNames(env);

        const envNames = envKeys.filter(name => {
            if (/^[$_a-z][$_a-z0-9]*$/i.test(name)) return true;
            console.warn(`"${name}" is not a legal env variable name.`);
            return false;
        });

        for (const key of this.#preNames) {
            if (!hasOwn(env, key)) {
                envNames.push(key);
            }
        }

        this.#preNames = envNames;

        envNames.map(name => {
            this.#envMap[name] = env[name];
            return name;
        });

        return envNames;
    }

    #createScopedEval(): NestedContext {
        const envNames = this.#patchEnv(this.windowShadow.shadow);

        const strToCreateEval = `
        ;(function(${envNames.join(', ')}) {
            ${this.useStrict ? '' : '"use strict";'}
            var __$_FN__ = {};

            var __$__UPDATE__ = \`
                __$_FN__.eval = str => {
                    var ret = eval(str);
                    eval(__$__UPDATE__);
                    return ret
                };
            \`;

            eval(__$__UPDATE__);

            return __$_FN__;
        }).call(window.${this.#CTX_KEY}, ${envNames.map(key => `window.${this.#ENV_KEY}.${key}`).join(', ')})`;

        this.debug('strToCreateEval=%s.', strToCreateEval);

        if (!this.#nestedContext) {
            this.#nestedContext = (0, eval)(strToCreateEval) as NestedContext;
        }

        return this.#nestedContext;
    }
}
