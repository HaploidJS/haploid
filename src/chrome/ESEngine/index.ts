import { SimpleESEngine } from './SimpleESEngine';
import { ScopedESEngine } from './ScopedESEngine';
import type { ESEngine } from './interfaces';

export function createESEngine(scoped: boolean, ...args: ConstructorParameters<typeof SimpleESEngine>): ESEngine {
    return scoped ? new ScopedESEngine(...args) : new SimpleESEngine(...args);
}

export type { ESEngine };
