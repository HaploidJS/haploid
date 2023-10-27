import { setupAppLoadAtomic, getUniversalAppLoadAtomic } from '@/load-atomic';
import { SingletonAtomic } from '@/Atomic';

describe.only('setup atomic', () => {
    it('setupAppLoadAtomic works before getUniversalAppLoadAtomic', async () => {
        setupAppLoadAtomic(2);
        const atomic = getUniversalAppLoadAtomic();

        expect(atomic).toBeInstanceOf(SingletonAtomic);
        expect(atomic.capacity).toBe(2);
    });
});
