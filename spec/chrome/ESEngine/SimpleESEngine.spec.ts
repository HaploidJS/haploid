import { createESEngine } from '@/chrome/ESEngine/';
import { RawWindowNode } from '@/chrome/BOM/';

describe.only('SimpleESEngine', () => {
    it('inject variables', async () => {
        const engine = createESEngine(false, new RawWindowNode({ __DEV__: true }));

        expect(
            engine.execScript(`
        __DEV__
        `)
        ).toBe(true);

        // do not leak
        expect(Reflect.has(window, '__DEV__')).toBe(false);
    });

    it('works even env variable conflict', async () => {
        Reflect.defineProperty(window, '__DEV__', {
            value: 6,
            writable: true,
            configurable: true,
        });

        const engine = createESEngine(false, new RawWindowNode({ __DEV__: true }));

        expect(
            engine.execScript(`
        __DEV__
        `)
        ).toBe(true);

        // recovered
        expect(Reflect.get(window, '__DEV__')).toBe(6);
    });

    it('do not throw if env variable conflict', async () => {
        Reflect.defineProperty(window, '__DEV__', {
            value: 6,
            writable: true,
            configurable: false,
        });

        const engine = createESEngine(false, new RawWindowNode({ __DEV__: true }));

        expect(
            engine.execScript(`
        __DEV__
        `)
        ).toBe(6);
    });
});
