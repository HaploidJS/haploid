export function simplePromiseAllSettled(ps: unknown[]): Promise<void> {
    return Promise.all(
        ps.map(p =>
            Promise.resolve(p).then(
                () => {},
                () => {}
            )
        )
    ).then(() => {});
}
