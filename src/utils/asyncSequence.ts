type F<T extends Array<unknown>> = (...args: T) => unknown;
type FS<T extends Array<unknown>> = Array<F<T>>;

export async function asyncSequence<P extends Array<unknown>>(
    fns: FS<P>,
    args: P,
    context: unknown = null,
    each?: (index: number) => void
): Promise<void> {
    let i = 0;
    const walk = async (): Promise<void> => {
        if (i === fns.length) {
            return;
        }
        const fn = fns[i];
        await fn.apply(context, args);

        if ('function' === typeof each) {
            each(i);
        }

        i += 1;
        await walk();
    };

    await walk();
}
