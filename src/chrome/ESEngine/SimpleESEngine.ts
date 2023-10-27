import { BaseESEngine } from './BaseESEngine';
import { hasOwn } from '../../utils/hasOwn';
import { summary } from '../utils';

export class SimpleESEngine extends BaseESEngine {
    protected get debugName(): string {
        return 'chrome:SimpleESEngine';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public execScript<T = any>(code: string, src?: string): T {
        this.debug('execScript(%s, %s).', summary(code), src);
        code = this.fixSourceURL(code, src);

        const envVariables = this.windowShadow.shadow;
        const keys = Object.getOwnPropertyNames(envVariables);
        const symbols = Object.getOwnPropertySymbols(envVariables);

        const savedDescriptors: Record<PropertyKey, PropertyDescriptor> = {};

        for (const key of [...keys, ...symbols]) {
            const des = Object.getOwnPropertyDescriptor(this.windowShadow.node, key);
            if (des) savedDescriptors[key] = des;
        }

        this.debug(`savedDescriptors: %O.`, savedDescriptors);

        // inject
        this.debug('Inject environment variables: %O.', envVariables);
        for (const key of [...keys, ...symbols]) {
            try {
                const desInEnv = Object.getOwnPropertyDescriptor(envVariables, key);
                if (desInEnv) Object.defineProperty(this.windowShadow.node, key, desInEnv); // Must exist.
            } catch (e) {
                console.warn(`Save ${String(key)} in window failed: `, e);
            }
        }

        try {
            // Wrap with iife
            if (this.options.iife) {
                return (0, eval)(`(function() {\n
                    ${this.useStrict ? '"use strict";' : ''}\n
                    ${code}\n
                }).call(window);`) as T;
            }

            return (0, eval)(code) as T;
        } finally {
            // recover
            this.debug('Recover environment variables: %O.', envVariables);
            for (const key of [...keys, ...symbols]) {
                try {
                    if (!hasOwn(savedDescriptors, key)) {
                        if (!Reflect.deleteProperty(window, key)) {
                            console.warn(`Failed to delete ${String(key)} from global.`);
                        }
                    } else {
                        Object.defineProperty(window, key, savedDescriptors[key]);
                    }
                } catch (e) {
                    console.warn(`Recover ${String(key)} in global faild: `, e);
                }
            }
        }
    }
}
