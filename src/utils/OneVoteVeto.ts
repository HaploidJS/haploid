export type OneVoteVetoController<S> = {
    veto: () => Promise<true | S[]>;
    pass: (reason?: S) => Promise<true | S[]>;
};

export class OneVoteVeto<S> {
    readonly #controllerPromises: Promise<S | undefined>[] = [];
    readonly #controllers: OneVoteVetoController<S>[] = [];

    constructor(expect: number) {
        Array.from(Array(expect), () => {
            const p = new Promise<S | undefined>((resolve, reject) => {
                this.#controllers.push({
                    pass: (reason?: S) => Promise.resolve(resolve(reason)).then(() => this.isFinalVetoed()),
                    veto: () => Promise.resolve(reject()).then(() => this.isFinalVetoed()),
                });
            });

            this.#controllerPromises.push(p);
        });
    }

    #controllerIndex = 0;

    public getNextController(): OneVoteVetoController<S> {
        return this.#controllers[this.#controllerIndex++];
    }

    public isFinalVetoed(): Promise<true | S[]> {
        return Promise.all(this.#controllerPromises).then(
            data => {
                const ds = data.filter(d => 'undefined' !== typeof d) as S[];
                return Array.from(new Set<S>(ds));
            },
            () => true
        );
    }
}
