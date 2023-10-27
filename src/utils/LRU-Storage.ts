import { Debugger } from './Debugger';
import { hasOwn } from './hasOwn';

type Storage = {
    version: number;
    record: Record<string, number[]>;
};

// Storage format:
//
// {
//     version: 1,
//     record: {
//         foo: [1676977837427, 1676977827427, 1676977817427], // up to "max" size
//         bar: [1676976837427, 1676976827427, 1676976817427]
//     }
// }

const defaultStorageKey = '__@haploid_lru_x0810__';
const currentVersion = 1;

export type LRUStorageOptions = {
    expire: number;
    max: number;
    factor: number;
    top: number;
    storageKey: string;
    readStorage: () => Storage;
    onExceed: (key: string) => void;
    writeStorage: (storage: Storage) => void;
};

const defaultOptions: LRUStorageOptions = {
    expire: 7 * 86400 * 1000, // 7day
    max: 30,
    factor: 0.1,
    top: 5,
    storageKey: '',
    onExceed: () => {},
    readStorage(this: LRUStorageOptions): Storage {
        try {
            const ret = JSON.parse(localStorage.getItem(defaultStorageKey + this.storageKey) ?? '{}') as Storage;

            if ('number' !== typeof ret.version) {
                throw Error('Lack of number version');
            }

            if (ret.version > currentVersion) {
                throw Error('Value of version is newer.');
            }

            if ('object' !== typeof ret.record) {
                throw Error('Lack of object record.');
            }

            return ret;
        } catch {
            return {
                version: currentVersion,
                record: {},
            };
        }
    },
    writeStorage(this: LRUStorageOptions, storage: Storage): void {
        localStorage.setItem(defaultStorageKey + this.storageKey, JSON.stringify(storage));
    },
};

export class LRUStorage extends Debugger {
    #options: LRUStorageOptions;
    constructor(opts: Partial<LRUStorageOptions>) {
        super();
        this.#options = Object.assign({}, defaultOptions, opts);
    }

    protected get debugName(): string {
        return 'lru-storage';
    }

    /**
     * Update refresh time for specified key.
     * @param key string
     */
    public touch(key: string): void {
        this.debug('touch %s', key);
        const record = this.#getAvaliableRecord();

        const now = Date.now();
        if (key in record && Array.isArray(record[key])) {
            record[key].push(now);
        } else {
            record[key] = [now];
        }

        const max = Math.max(1, this.#options.max);

        if (record[key].length > max) {
            this.#options.onExceed(key);
            // Only save last max elements.
            record[key] = record[key].slice(-max);
        }

        this.#options.writeStorage({
            version: currentVersion,
            record,
        });
    }

    /**
     * Calculate keys in hot order, max to "top" size
     * @returns string[]
     */
    public getCollection(): string[] {
        const record = this.#getAvaliableRecord();
        const now = Date.now();
        const { expire, factor, top } = this.#options;

        const q: { key: string; score: number }[] = [];

        for (const key in record) {
            if (!hasOwn(record, key)) continue;
            const visit = record[key];
            // f(x) = expire / (x + expire * factor)
            const score = visit.reduce((sc, curr) => sc + expire / (now - curr + expire * factor), 0);
            q.push({ score, key });
        }

        // sort by score
        q.sort((p, n) => n.score - p.score);
        this.debug('key and scores: %o.', q);
        // Only keep "top" elements.
        return q.map(v => v.key).slice(0, Math.max(1, top));
    }

    #getAvaliableRecord(): Record<string, number[]> {
        const { expire } = this.#options;
        const storage = this.#options.readStorage();
        const now = Date.now();
        const needDeleteKeys: string[] = [];

        for (const key in storage.record) {
            if (!hasOwn(storage.record, key)) continue;

            const visit = storage.record[key];
            if (!Array.isArray(visit)) {
                storage.record[key] = [];
            } else {
                storage.record[key] = visit.filter(p => now - p < expire);
            }
            // Clear this key if no visit at all.
            if (0 === storage.record[key].length) needDeleteKeys.push(key);
        }

        for (const key of needDeleteKeys) Reflect.deleteProperty(storage.record, key);

        return storage.record;
    }
}
