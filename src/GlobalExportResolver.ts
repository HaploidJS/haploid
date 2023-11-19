import {
    __HAPLOID_GLOBAL_EXPORT_RESOLVER__,
    __HAPLOID_GLOBAL_MAP_GLOBAL_EXPORTED__,
    HAPLOID_GLOBAL_EXPORT_RESOLVER_VERSION,
} from './constant';

import { noteGlobalProps, getGlobalProp } from './utils/global-prop';
import { createUniversalFactory } from './utils/createUniversalFactory';
import { murmurhash3_32_gc } from './utils/murmurhash3_gc';
import { ensureGlobalMap } from './utils/ensureGlobalMap';
import { Debugger } from './utils/Debugger';

/**
 * Resolve the exported object from a global-formatted JS resource.
 */
class GlobalExportResolver extends Debugger {
    static #instance: GlobalExportResolver;

    readonly #exportedMap = ensureGlobalMap<string, keyof Window>(__HAPLOID_GLOBAL_MAP_GLOBAL_EXPORTED__);

    private constructor() {
        super();
        /* istanbul ignore if: difficult to enter */
        if (GlobalExportResolver.#instance) {
            throw Error('GlobalExportResolver cannot be created more than once.');
        }
    }

    protected get debugName(): string {
        return 'global-export-resolver';
    }

    public get version(): number {
        return HAPLOID_GLOBAL_EXPORT_RESOLVER_VERSION;
    }

    public static getInstance(): GlobalExportResolver {
        if (!GlobalExportResolver.#instance) {
            GlobalExportResolver.#instance = new GlobalExportResolver();
        }

        return GlobalExportResolver.#instance;
    }

    public resolve(evalScript: () => unknown, src: string, global: Window = window): keyof Window {
        this.debug('Call resolveUnsafe(%o, %s, window)', evalScript, src);

        noteGlobalProps(global);

        evalScript();

        let entryName = getGlobalProp(global) as keyof Window;

        let srcKey = '';
        let cachedKey: keyof Window | undefined = undefined;

        if (src) {
            const start = performance.now();
            // 10ms for 400kb text
            srcKey = String(murmurhash3_32_gc(src, 0x0810));

            const costs = performance.now() - start;

            if (costs > 10) {
                console.warn(
                    `hash(${
                        src.length > 50 ? `${src.slice(0, 50)}...` : src
                    }) costs more than 10ms, avoid using big text as src.`
                );
            }

            if (this.debug.enabled) {
                this.debug('hash(%s) costs %sms.', src.length > 50 ? `${src.slice(0, 50)}...` : src, costs);
            }

            cachedKey = this.#exportedMap.get(srcKey);
        }

        if (!entryName) {
            if (cachedKey) {
                this.debug('Use cached key %s for %s.', cachedKey, src);
                entryName = cachedKey;
            } else {
                throw Error(`Cannot find global exported object in ${src}.`);
            }
        }

        if (cachedKey && cachedKey !== entryName) {
            console.warn(
                `The resolved global exported key "${entryName}" does not equal with previously cached "${cachedKey}" from "${src}".`
            );
        }

        if (!global[entryName]) {
            throw Error(`Cannot find global exported object in ${src}.`);
        }

        if (srcKey) {
            this.#exportedMap.set(srcKey, entryName);
        }

        return entryName;
    }

    public get [Symbol.toStringTag](): string {
        return 'GlobalExportResolver';
    }
}

export type { GlobalExportResolver };

export const getUniversalGlobalExportResolver = createUniversalFactory<GlobalExportResolver>(
    __HAPLOID_GLOBAL_EXPORT_RESOLVER__,
    () => GlobalExportResolver.getInstance(),
    HAPLOID_GLOBAL_EXPORT_RESOLVER_VERSION,
    // Conflict is better than throwing error.
    true
);
