import { __HAPLOID_DOWNLOADER__, __HAPLOID_GLOBAL_MAP_DOWNLOADER__, HAPLOID_DOWNLOADER_VERSION } from './constant';
import { LooseAtomic } from './Atomic';

import { fetchWithTimeoutAndRetry } from './utils/fetchWithTimeoutAndRetry';
import { createUniversalFactory } from './utils/createUniversalFactory';
import { ensureGlobalMap } from './utils/ensureGlobalMap';
import { Debugger } from './utils/Debugger';

class Downloader extends Debugger {
    static #instance: Downloader;

    readonly #contentMap = ensureGlobalMap<string, string>(__HAPLOID_GLOBAL_MAP_DOWNLOADER__);

    #atomic = new LooseAtomic<string>();

    private constructor() {
        super();
        /* istanbul ignore if: difficult to enter */
        if (Downloader.#instance) {
            throw Error('Downloader cannot be created more than once.');
        }
    }

    protected get debugName(): string {
        return `downloader`;
    }

    public get version(): number {
        return HAPLOID_DOWNLOADER_VERSION;
    }

    public static getInstance(): Downloader {
        if (!Downloader.#instance) {
            Downloader.#instance = new Downloader();
        }

        return Downloader.#instance;
    }

    public download(src: string, requestOptions?: RequestInit, timeout?: number, retries?: number): Promise<string> {
        this.debug('Call download(%s, %o, %s, %s).', src, requestOptions, timeout, retries);

        const urlObj = new URL(src, location.href);
        src = urlObj.href;

        const createFetch = async (): Promise<string> => {
            let content = this.#contentMap.get(src);

            if (content) {
                this.debug('Got %s from cache.', src);
                return content;
            }

            this.debug('fetch(%s).', src);
            content = await fetchWithTimeoutAndRetry(src, requestOptions, timeout, retries).then(res => res.text());

            if (content) {
                this.debug('cache %s.', src);
                this.#contentMap.set(src, content);
            }

            return content ?? '';
        };

        return this.#atomic.waitFor(src, createFetch);
    }
}

export type { Downloader };

export const getUniversalDownloader = createUniversalFactory<Downloader>(
    __HAPLOID_DOWNLOADER__,
    () => Downloader.getInstance(),
    HAPLOID_DOWNLOADER_VERSION,
    true // Allow conflict.
);
