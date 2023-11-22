import { SimpleESEngine } from './SimpleESEngine';
import { ShadowESEngine } from './ShadowESEngine';
import type { ESEngine } from './interfaces';

export function createESEngine(scoped: boolean, ...args: ConstructorParameters<typeof SimpleESEngine>): ESEngine {
    return scoped ? new ShadowESEngine(...args) : new SimpleESEngine(...args);
}

export type { ESEngine };
