export type CounterController = {
    count: () => Promise<void>;
};
export class Counter {
    readonly #controllerPromises: Promise<void>[] = [];
    readonly #controllers: CounterController[] = [];

    constructor(expect: number) {
        Array.from(Array(expect), () => {
            const p = new Promise<void>(resolve => {
                this.#controllers.push({
                    count: () => Promise.resolve(resolve()).then(() => this.whenReached()),
                });
            });

            this.#controllerPromises.push(p);
        });
    }

    #controllerIndex = 0;

    public getNextController(): CounterController {
        return this.#controllers[this.#controllerIndex++];
    }

    public whenReached(): Promise<void> {
        return Promise.all(this.#controllerPromises).then(() => {});
    }
}
