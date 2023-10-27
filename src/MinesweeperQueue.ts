import { Debugger } from './utils/Debugger';

export class MinesweeperQueue<T extends { isCanceled?: boolean }> extends Debugger {
    readonly #q: T[] = [];

    constructor(q: T[]) {
        super();
        if (q.length === 0) {
            throw Error(`Require at least one element for a new MinesweeperQueue.`);
        }
        this.#q.push(...q);
    }

    public override toString(): string {
        return 'MinesweeperQueue';
    }

    public get [Symbol.toStringTag](): string {
        return 'MinesweeperQueue';
    }

    protected get debugName(): string {
        return 'minesweeper-queue';
    }

    public add(element: T): void {
        if ('isCanceled' in element) {
            throw Error(`${this} doesn't accept an element with key "isCanceled".`);
        }
        this.#q.push(element);
    }

    public cancelElement(element: T): boolean {
        this.debug('Call cancelElement(%O).', element);

        if ('undefined' !== typeof element.isCanceled) {
            console.warn('Try to cancel a element to be not cancelled that has been confirmed or cancelled before.');
            return false;
        }

        element.isCanceled = true;

        if (this.top === element) {
            this.debug('The element is at the top, search backward for cancelled ones, and remove them: %O.', element);

            let i = this.#q.length;

            // Remove all cancelled from the right side.
            do {
                i -= 1;
            } while (i > 0 && this.#q[i].isCanceled);

            const removedElements = this.#q.splice(i + 1);
            this.debug(
                'Remove %d element(s) due to cancelled: %O, remainings: %O.',
                removedElements.length,
                removedElements,
                this.#q
            );

            return true;
        } else {
            this.debug(
                'The element is NOT at the top, cannot remove it, wait for the following cancelation to handle it, or it has already been removed: %O.',
                element
            );
            return false;
        }
    }

    public confirmElement(element: T): void {
        this.debug('Call confirmElement(%O).', element);

        if ('undefined' !== typeof element.isCanceled) {
            console.warn('Try to confirm a element to be not cancelled that has been confirmed or cancelled before.');
            return;
        }

        element.isCanceled = false;

        // Remove all cancelled or being cancelled from the left side.
        let i = this.#q.length;
        do {
            i -= 1;
        } while (i > 0 && this.#q[i].isCanceled !== false);

        const removedElements = this.#q.splice(0, i);
        this.debug(
            'Removed %d element(s) from head due to confirmed: %O, remainings: %O.',
            i,
            removedElements,
            this.#q
        );
    }

    public get top(): T {
        return this.#q[this.#q.length - 1];
    }
}
