import { ScriptNode } from '@/node';
import { BaseESEngine } from '../BaseESEngine';
import { WindowNode } from '../../BOM/';

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

    it('onBefore/onAfter', () => {
        const engine = new TestESEngine(new WindowNode('test', {}));

        const before = jest.fn();
        const after = jest.fn();

        engine.execScript(
            new ScriptNode({
                content: '',
            }),
            before,
            after
        );

        expect(before).toHaveBeenCalled();
        expect(after).toHaveBeenCalled();
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
