import { delay } from '../test-utils';
import { LifecycleFns } from '@/Def';
import { App } from '@/App';

export function createApp<T = Record<never, never>>(
    lifecycles?: Partial<LifecycleFns<T>>,
    loadingDelay = 0
): App<Record<never, never>, T> {
    const lf = {
        mount: lifecycles?.mount || ((): Promise<void> => delay(0)),
        unmount: lifecycles?.unmount || ((): Promise<void> => delay(0)),
        bootstrap: lifecycles?.bootstrap,
        update: lifecycles?.update,
    };

    const app = new App<Record<never, never>, T>({
        name: 'foo',
        lifecycle: loadingDelay ? delay(loadingDelay).then(() => lf) : lf,
    });

    return app;
}
