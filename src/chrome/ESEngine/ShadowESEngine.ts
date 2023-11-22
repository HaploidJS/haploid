import { BaseESEngine } from './BaseESEngine';
import type { ScriptNode } from '../../node';

export class ShadowESEngine extends BaseESEngine {
    constructor(...args: ConstructorParameters<typeof BaseESEngine>) {
        super(...args);
    }

    protected get debugName(): string {
        return 'chrome:ShadowESEngine';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected override execESMScript<T = any>(script: ScriptNode): Promise<T> {
        console.warn(`ESM cannot be evaluated in sandbox temporarily.`);
        return super.execESMScript(script);
    }

    public override onDestroy(): void {
        // Attention: NEVER delete ENV_KEY/CTX_KEY from global.
        super.onDestroy();
    }
}
