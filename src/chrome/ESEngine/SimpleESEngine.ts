import { BaseESEngine, type ExecHooksPair } from './BaseESEngine';

export class SimpleESEngine extends BaseESEngine {
    protected get debugName(): string {
        return 'chrome:SimpleESEngine';
    }

    protected override getExecNonESMHooks(): ExecHooksPair[] {
        const conflictKeysWithGlobal: Set<PropertyKey> = new Set();
        let envVariables: Record<PropertyKey, unknown> = {};
        let enumkeys: PropertyKey[] = [];
        return [
            ...super.getExecNonESMHooks(),
            {
                before: (script, options): void => {
                    // Merge
                    envVariables = {
                        ...this.windowShadow.shadow,
                        ...options?.env,
                    };
                    enumkeys = Reflect.ownKeys(envVariables).filter(
                        key => Reflect.getOwnPropertyDescriptor(envVariables, key)?.enumerable
                    );
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
                },
                after: (): void => {
                    // recover
                    this.debug('Remove environment variables: %O.', envVariables);
                    for (const key of enumkeys) {
                        if (!conflictKeysWithGlobal.has(key) && !Reflect.deleteProperty(window, key)) {
                            console.warn(`Failed to delete ${String(key)} from global.`);
                        }
                    }
                },
            },
        ];
    }
}
