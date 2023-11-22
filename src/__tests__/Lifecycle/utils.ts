import type { LifecycleFns, LifecycleOptions } from '../../Def';
import { Lifecycle } from '../../Lifecycle';

export function createLifecycle<T = unknown>(
    fns?: Partial<LifecycleFns<T>>,
    options?: Partial<LifecycleOptions<T>>
): Lifecycle<T> {
    const lifecycle = new Lifecycle<T>({
        name: 'foo',
        ...options,
    });

    lifecycle.setFns(
        Object.assign(
            {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
            fns
        )
    );

    return lifecycle;
}
