import type { ScriptNode } from '../../node/';

export interface ESEngine {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execScript: <T = any>(
        script: ScriptNode,
        options?: {
            env?: Record<string, unknown>;
            scriptElement?: HTMLScriptElement;
        }
    ) => Promise<T> | void;
    onDestroy: () => void;
}
