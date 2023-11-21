import { BaseESEngine } from './BaseESEngine';
import type { ScriptNode } from '../../node/';

export class SimpleESEngine extends BaseESEngine {
    protected get debugName(): string {
        return 'chrome:SimpleESEngine';
    }

    protected override execNonESMScript(script: ScriptNode): void {
        const { src, content } = script;
        this.debug('onExecScript(%o).', script);

        const code = this.fixSourceURL(content, src);

        const envVariables = this.windowShadow.shadow;
        const enumkeys = Reflect.ownKeys(envVariables).filter(
            key => Reflect.getOwnPropertyDescriptor(envVariables, key)?.enumerable
        );

        const conflictKeysWithGlobal: Set<PropertyKey> = new Set();

        for (const key of enumkeys) {
            if (Reflect.has(this.windowShadow.node, key)) conflictKeysWithGlobal.add(key);
        }

        this.debug(`conflictKeysWithGlobal: %O.`, conflictKeysWithGlobal);

        // inject
        this.debug('Inject environment variables: %O.', envVariables);
        for (const key of enumkeys) {
            try {
                const desInEnv = Reflect.getOwnPropertyDescriptor(envVariables, key);
                if (desInEnv && !conflictKeysWithGlobal.has(key))
                    Object.defineProperty(this.windowShadow.node, key, desInEnv); // Must exist.
            } catch (e) {
                console.warn(`Save ${String(key)} in window failed: `, e);
            }
        }

        try {
            this.scopedEvaluator.evaluate(code);
        } finally {
            // recover
            this.debug('Remove environment variables: %O.', envVariables);
            for (const key of enumkeys) {
                if (!conflictKeysWithGlobal.has(key) && !Reflect.deleteProperty(window, key)) {
                    console.warn(`Failed to delete ${String(key)} from global.`);
                }
            }
        }
    }
}
