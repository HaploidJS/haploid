import { ScriptNode } from '../../../node';
import { BaseESEngine } from '../BaseESEngine';
import { WindowNode, RawWindowNode } from '../../BOM/';

class TestESEngine extends BaseESEngine {
    protected override execNonESMScript(script: ScriptNode): void {
        this.scopedEvaluator.evaluate(script.content);
    }

    protected override get debugName(): string {
        return 'test:TestESEngine';
    }
}

describe('exec script', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('non-ESM', () => {
        const engine = new TestESEngine(new WindowNode('test', {}));

        engine.execScript(
            new ScriptNode({
                content: 'window.foo = 1',
            })
        );

        expect(Reflect.get(engine.windowShadow.node, 'foo')).toBe(1);
    });

    it('ESM', async () => {
        const engine = new TestESEngine(new WindowNode('test', {}));

        const ret = engine.execScript(
            new ScriptNode({
                src: `http://localhost:10810/chrome/script.js`,
                type: 'module',
            })
        );

        await expect(ret).resolves.toMatchObject({ default: 12 });
    });

    it.todo('ESM code');
});

describe('currentScript', () => {
    it('with WindowNode', async () => {
        const win = new WindowNode('test', {});
        const engine = new TestESEngine(win);

        const ele = win.node.document.createElement('script');

        engine.execScript(
            new ScriptNode({
                content: `
            window.currentScript = document.currentScript;
            window.getCurrentScript = () => document.currentScript;
           `,
            }),
            {
                scriptElement: ele,
            }
        );

        expect(Reflect.get(win.node, 'currentScript')).toStrictEqual(ele);
        expect(Reflect.get(win.node, 'getCurrentScript')()).toBeNull();
        expect(Reflect.get(win.node.document, 'currentScript')).toBeNull();
    });

    it('with RawWindowNode', async () => {
        const win = new RawWindowNode({});
        const engine = new TestESEngine(win);

        const ele = win.node.document.createElement('script');

        engine.execScript(
            new ScriptNode({
                content: `
            window.currentScript = document.currentScript;
            window.getCurrentScript = () => document.currentScript;
           `,
            }),
            {
                scriptElement: ele,
            }
        );

        expect(Reflect.get(win.node, 'currentScript')).toStrictEqual(ele);
        expect(Reflect.get(win.node, 'getCurrentScript')()).toBeNull();
        expect(Reflect.get(win.node.document, 'currentScript')).toBeNull();
    });
});
