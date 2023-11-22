import { getUniversalAtomic } from '../../Atomic';

describe.only('universal-atomic', () => {
    it('always get the same atomic instance', async () => {
        expect(getUniversalAtomic()).toStrictEqual(getUniversalAtomic());
    });
});
