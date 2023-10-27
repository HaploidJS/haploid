import { Container } from './Container';
import type { AppAPI } from './App';

/**
 * Container that can only activate applications manually, by activateApp().
 */
export class ManualContainer<
    ContainerAdditionalOptions = Record<never, never>,
    AppAdditionalOptions = Record<never, never>
> extends Container<ContainerAdditionalOptions, AppAdditionalOptions> {
    protected override get debugName(): string {
        return `manual-container:${this.options.name}`;
    }

    public override get [Symbol.toStringTag](): string {
        return 'ManualContainer';
    }

    /**
     * Activate an application specified by a name.
     * @param name App name to be activated.
     * @returns Promise<App>
     */
    public async activateApp(name: string | null): Promise<AppAPI<AppAdditionalOptions, unknown> | null> {
        this.debug('Call activateApp(%s).', name);
        this.throwErrorIfDestroy();
        return (await this.activateAppByName(name, `manual(${name})`))?.api ?? null;
    }
}
