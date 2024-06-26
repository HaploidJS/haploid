import { hasOwn } from '../../utils/hasOwn';
import { nativeWindow } from '../utils';
import { Debugger } from '../../utils/Debugger';

export interface NestedContext {
    eval: <T = unknown>(code: string) => T;
}

function findAvaliableKey(prefix: string): string {
    let gindex = 0;
    do {
        gindex += 1;
    } while (hasOwn(nativeWindow, `${prefix}${gindex}`));

    return `${prefix}${gindex}`;
}

export class ScopedEvaluator extends Debugger {
    readonly #baseEnv: Record<string, unknown>;
    #env: Record<string, unknown>;
    readonly #strict: boolean;

    readonly #ENV_KEY: string = findAvaliableKey('__HAPLOID_EVAL_ENV__$');
    readonly #CTX_KEY: string = findAvaliableKey('__HAPLOID_EVAL_CTX__$');

    constructor(options: { env?: Record<string, unknown>; useStrict?: boolean; global?: Window }) {
        super();
        this.#env = this.#baseEnv = options.env ?? {};
        this.#strict = options.useStrict === undefined || Boolean(options.useStrict);

        Reflect.defineProperty(nativeWindow, this.#ENV_KEY, {
            get: () => {
                return this.#env;
            },
            enumerable: false,
            configurable: true,
        });

        Reflect.defineProperty(nativeWindow, this.#CTX_KEY, {
            get: () => {
                return options.global;
            },
            enumerable: false,
            configurable: true,
        });
    }

    public get envKey(): string {
        return this.#ENV_KEY;
    }

    public get ctxKey(): string {
        return this.#CTX_KEY;
    }

    public get isStrict(): boolean {
        return this.#strict;
    }

    public get env(): Record<string, unknown> {
        return this.#env;
    }

    protected override get debugName(): string {
        return 'chrome:ScopedEvaluator';
    }

    public patchEnv(env?: Record<string, unknown>): string[] {
        this.#env = { ...this.#baseEnv, ...env };
        const envKeys = Object.keys(this.#env);

        const envNames = envKeys.filter(name => {
            if (/^[$_a-z][$_a-z0-9]*$/i.test(name)) return true;
            console.warn(`"${name}" is not a legal env variable name.`);
            return false;
        });

        return envNames;
    }

    public evaluate(code: string, env?: Record<string, unknown>): void {
        const envNames = this.patchEnv(env);

        const evalString = `
;(function(${envNames.join(', ')}) {
    ${this.#strict ? '"use strict";' : ''}
    ${code}
}).call(window.${this.#CTX_KEY}, ${envNames.map(key => `window.${this.#ENV_KEY}.${key}`).join(', ')})`;

        this.debug('evalString=%s.', evalString);

        (0, eval)(evalString);
    }
}
