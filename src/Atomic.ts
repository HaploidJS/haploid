import { __HAPLOID_ATOMIC__, HAPLOID_ATOMIC_VERSION } from './constant';

import { createUniversalFactory } from './utils/createUniversalFactory';
import { promiseIgnoreCatch } from './utils/promiseIgnoreCatch';
import { Debugger } from './utils/Debugger';

interface Waiter<S> {
    waitFor<T = unknown>(lock: S, promiseCreator: () => Promise<T>): Promise<T>;
}

export class Atomic<S extends object = object> extends Debugger implements Waiter<S> {
    protected get debugName(): string {
        return 'Atomic';
    }

    public get version(): number {
        return HAPLOID_ATOMIC_VERSION;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly #lockedMap = new WeakMap<S, Array<Promise<any>>>();

    #capacity: number;

    constructor(capacity = 1) {
        super();
        this.#capacity = capacity;
    }

    public get capacity(): number {
        return this.#capacity;
    }

    public waitFor<T = unknown>(lock: S, promiseCreator: () => Promise<T>): Promise<T> {
        this.debug('Call waitFor().');
        const runningPromises = this.#lockedMap.get(lock) ?? [];

        if (runningPromises.length >= this.capacity) {
            this.debug('Exceed capacity(%d).', this.capacity);
            return promiseIgnoreCatch(Promise.race(runningPromises)).then(() => this.waitFor(lock, promiseCreator));
        }

        const newPromise = Promise.resolve()
            .then(() => promiseCreator())
            .finally(() => {
                this.debug('Notified.');
                const newlocks = this.#lockedMap.get(lock);
                if (newlocks) {
                    const idx = newlocks.findIndex(lo => lo === newPromise);
                    if (idx > -1) newlocks.splice(idx, 1);
                }
            });

        runningPromises.push(newPromise);

        this.#lockedMap.set(lock, runningPromises);

        return newPromise;
    }
}

export class SingletonAtomic<S extends object = object> extends Atomic<S> {
    readonly #locker = Object.create(null);

    protected override get debugName(): string {
        return 'SingletonAtomic';
    }

    public wait<T = unknown>(promiseCreator: () => Promise<T>): Promise<T> {
        return this.waitFor(this.#locker, promiseCreator);
    }
}

export class LooseAtomic<S = unknown> extends Debugger implements Waiter<S> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly #lockedMap = new Map<S, void | Promise<any>>();

    protected get debugName(): string {
        return 'LooseAtomic';
    }

    public waitFor<T = unknown>(lock: S, promiseCreator: () => Promise<T>): Promise<T> {
        this.debug('Call waitFor(%o).', lock);
        let runningPromise = this.#lockedMap.get(lock);

        if (runningPromise) {
            this.debug('Taken %o, wait.', lock);
            return promiseIgnoreCatch(Promise.resolve().then(() => runningPromise)).then(() =>
                this.waitFor(lock, promiseCreator)
            );
        }

        runningPromise = Promise.resolve()
            .then(() => promiseCreator())
            .finally(() => {
                this.debug('Notified %o.', lock);
                this.#lockedMap.delete(lock);
            });

        this.#lockedMap.set(lock, runningPromise);

        return runningPromise;
    }
}

export const getUniversalAtomic = createUniversalFactory<Atomic>(
    __HAPLOID_ATOMIC__,
    () => new Atomic(),
    HAPLOID_ATOMIC_VERSION,
    // Conflict is better than throwing error.
    true
);
