import { BaseESEngine } from './BaseESEngine';
import type { ScriptNode } from '../../node/';

export class ScopedESEngine extends BaseESEngine {
    constructor(...args: ConstructorParameters<typeof BaseESEngine>) {
        super(...args);
    }

    protected get debugName(): string {
        return 'chrome:ScopedESEngine';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override execESMScript<T = any>(script: ScriptNode): Promise<T> {
        console.warn(`ESM cannot be evaluated in sandbox temporarily.`);
        return super.execESMScript(script);
    }

    protected override execNonESMScript(script: ScriptNode): void {
        const { src, content } = script;
        this.debug('onExecScript(%o).', script);

        const code = this.fixSourceURL(content, src);
        this.scopedEvaluator.evaluate(code);
    }

    public override onDestroy(): void {
        // Attention: NEVER delete ENV_KEY/CTX_KEY from global.
        super.onDestroy();
    }
}
