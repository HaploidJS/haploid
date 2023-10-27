import debug from 'debug';
import { SDK_NAME, SDK_VERSION } from '../constant';
import { VersionLabel } from './VersionLabel';

export const baseDebugger = debug(`${SDK_NAME}(${SDK_VERSION})`);

export abstract class Debugger implements VersionLabel {
    #logger: ReturnType<debug.Debug> | null = null;

    protected abstract get debugName(): string;

    protected get debug(): ReturnType<debug.Debug> {
        if (this.#logger) {
            return this.#logger;
        }

        this.#logger = baseDebugger.extend(`${this.debugName}`);
        return this.#logger;
    }

    // For convenience to be here.
    public get __HAPLOID_VERSION__(): string {
        return SDK_VERSION;
    }
}
