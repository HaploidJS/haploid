import { ensureGlobalMap, ensureGlobalWeakMap } from '@/utils/ensureGlobalMap';

describe('ensureGlobalMap', () => {
    it('ensure a string key', async () => {
        expect(ensureGlobalMap('_D&UJD')).toBeInstanceOf(Map);
    });
    it('ensure a symbol key', async () => {
        expect(ensureGlobalMap(Symbol.for('_D&UJD'))).toBeInstanceOf(Map);
    });
    it('return same instance', async () => {
        expect(ensureGlobalMap('(*TY# (*Y')).toStrictEqual(ensureGlobalMap('(*TY# (*Y'));
    });
});

describe('ensureGlobalWeakMap', () => {
    it('ensure a string key', async () => {
        expect(ensureGlobalWeakMap('()H*(GD')).toBeInstanceOf(WeakMap);
    });
    it('ensure a symbol key', async () => {
        expect(ensureGlobalWeakMap(Symbol.for('()H*(GD'))).toBeInstanceOf(WeakMap);
    });
    it('return same instance', async () => {
        expect(ensureGlobalWeakMap('(*TY# (*Y')).toStrictEqual(ensureGlobalWeakMap('(*TY# (*Y'));
    });
});
