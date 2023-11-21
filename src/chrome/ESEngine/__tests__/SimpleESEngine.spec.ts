import { createESEngine } from '../';
import { RawWindowNode } from '../../BOM/';
import { ScriptNode } from '../../../node/';

describe('define env in global/window and remove later', () => {
    it('read env from window', async () => {
        const engine = createESEngine(false, new RawWindowNode({ __DEV__: 1 }));

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = window.__DEV__`,
            })
        );

        expect(Reflect.get(window, '__RESULT__')).toBe(1);
    });

    it('read env from globalThis', async () => {
        const engine = createESEngine(false, new RawWindowNode({ __DEV__: 1 }));

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = globalThis.__DEV__`,
            })
        );

        expect(Reflect.get(window, '__RESULT__')).toBe(1);
    });

    it('read symbol', async () => {
        const engine = createESEngine(false, new RawWindowNode({ [Symbol.for('x')]: 1 }));

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = window[Symbol.for('x')]`,
            })
        );

        expect(Reflect.get(window, '__RESULT__')).toBe(1);
    });

    it('window/global is cleaned', async () => {
        const engine = createESEngine(false, new RawWindowNode({ __DEVC__: 1 }));

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = window.__DEVC__`,
            })
        );

        expect(Reflect.has(window, '__DEVC__')).toBe(false);
    });

    it('works even env variable conflicts with global', async () => {
        Reflect.defineProperty(window, '__DEV__', {
            value: 1,
            writable: true,
            configurable: true,
        });

        const engine = createESEngine(false, new RawWindowNode({ __DEV__: 2 }));

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = window.__DEV__`,
            })
        );

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT2__ = __DEV__`,
            })
        );

        expect(Reflect.get(window, '__RESULT__')).toBe(1); // respect to real
        expect(Reflect.get(window, '__RESULT2__')).toBe(2);
        // global is not affected
        expect(Reflect.get(window, '__DEV__')).toBe(1);
    });
});
