import { getUniversalAppLoadAtomic } from '../../load-atomic';
import { DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY } from '../../constant';

describe.only('default capacity', () => {
    it(`capcacity is ${DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY} if setupAppLoadAtomic not called`, async () => {
        const atomic = getUniversalAppLoadAtomic();

        expect(atomic.capacity).toBe(DEFAULT_HAPLOID_MAX_LOAD_CONCURRENCY);
    });
});
