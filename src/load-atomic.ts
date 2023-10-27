/**
 * This file maintains an atomic that for app loading.
 */
import { createUniversalFactory } from './utils/createUniversalFactory';

import { __HAPLOID_APP_LOAD_ATOMIC__, HAPLOID_ATOMIC_VERSION, DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY } from './constant';
import { SingletonAtomic } from './Atomic';

const getUniversalSingletonAtomic = createUniversalFactory<SingletonAtomic, number>(
    __HAPLOID_APP_LOAD_ATOMIC__,
    (capacity: number) => new SingletonAtomic(capacity),
    // share version
    HAPLOID_ATOMIC_VERSION,
    // Conflict is better than throwing error.
    true
);

/**
 * App call this function get the global singleton atomic, to keep number of all loading process below "capacity".
 * @returns SingletonAtomic
 */
export function getUniversalAppLoadAtomic(): SingletonAtomic {
    return getUniversalSingletonAtomic(DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY);
}

/**
 * Container should call this function first to initialize capacity.
 * @param capacity number
 */
export function setupAppLoadAtomic(capacity: number): void {
    getUniversalSingletonAtomic(capacity);
}
