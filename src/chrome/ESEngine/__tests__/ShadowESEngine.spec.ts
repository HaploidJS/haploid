import { createESEngine } from '..';
import { WindowNode } from '../../BOM';
import { ScriptNode } from '../../../node';

describe('resolve env from proxy', () => {
    it('env do not leak', async () => {
        const win = new WindowNode('test', { __DEV__: 1 });
        const engine = createESEngine(true, win);
        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = window.__DEV__`,
            })
        );
        expect(Reflect.get(win.node, '__RESULT__')).toBe(1);
        expect(Reflect.get(win.node, '__DEV__')).toBe(1);
        expect(Reflect.has(window, '__RESULT__')).toBe(false);
        expect(Reflect.has(window, '__DEV__')).toBe(false);
    });

    it('read env directly', async () => {
        const win = new WindowNode('test', { __DEV__: 1 });
        const engine = createESEngine(true, win);

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = __DEV__`,
            })
        );

        expect(Reflect.get(win.node, '__RESULT__')).toBe(1);
    });

    it('read env from globalThis', async () => {
        const win = new WindowNode('test', { __DEV__: 1 });
        const engine = createESEngine(true, win);

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = globalThis.__DEV__`,
            })
        );

        expect(Reflect.get(win.node, '__RESULT__')).toBe(1);
    });

    it('read env from self', async () => {
        const win = new WindowNode('test', { __DEV__: 1 });
        const engine = createESEngine(true, win);

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = self.__DEV__`,
            })
        );

        expect(Reflect.get(win.node, '__RESULT__')).toBe(1);
    });

    it('read env from top', async () => {
        const win = new WindowNode('test', { __DEV__: 1 });
        const engine = createESEngine(true, win);

        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = top.__DEV__`,
            })
        );

        expect(Reflect.get(win.node, '__RESULT__')).toBe(1);
    });

    it('read symbol', async () => {
        const win = new WindowNode('test', { [Symbol.for('x')]: 1 });
        const engine = createESEngine(true, win);
        engine.execScript(
            new ScriptNode({
                content: `window.__RESULT__ = window[Symbol.for('x')]`,
            })
        );

        expect(Reflect.get(win.node, '__RESULT__')).toBe(1);
    });

    it('works even env variable conflicts with global', async () => {
        Reflect.defineProperty(window, '__DEV__', {
            value: 1,
            writable: true,
            configurable: true,
        });

        const win = new WindowNode('test', { __DEV__: 2 });
        const engine = createESEngine(true, win);

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

        expect(Reflect.get(win.node, '__RESULT__')).toBe(2); // respect to env
        expect(Reflect.get(win.node, '__RESULT2__')).toBe(2);
        // global is not affected
        expect(Reflect.get(window, '__DEV__')).toBe(1);
    });
});
