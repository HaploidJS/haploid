import type { ScriptNode } from '../../node/';

export interface ESEngine {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    execScript: <T = any>(script: ScriptNode, onBefore?: () => any, onAfter?: () => any) => Promise<T> | T;
    onDestroy: () => void;
}
