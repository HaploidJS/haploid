type DeadLoopRecord<T> = {
    time: number;
    value: T;
};

export type DeadLoopDetectorOptions = {
    thresholdCount: number;
    looseThresholdCount: number;
    duration: number;
    maxSize: number;
};

export class DeadLoopDetector<T> {
    #queue: DeadLoopRecord<T>[] = [];
    readonly #options: DeadLoopDetectorOptions;

    constructor(options?: Partial<DeadLoopDetectorOptions>) {
        this.#options = Object.freeze(
            Object.assign(
                {
                    thresholdCount: 20,
                    looseThresholdCount: 50,
                    duration: 1000,
                    maxSize: 500,
                },
                options
            )
        );
    }

    public smellsLikeDead(t: T): boolean {
        const now = Date.now();

        this.#queue.push({
            time: now,
            value: t,
        });

        this.#queue.splice(0, this.#queue.length - this.#options.maxSize);

        let count = 0;
        let looseCount = 0;
        let i = this.#queue.length - 2;

        while (i >= 0 && now - this.#queue[i].time <= this.#options.duration) {
            if (t === this.#queue[i].value) {
                count += 1;
            }
            looseCount += 1;
            i -= 1;
        }

        if (count + 1 >= this.#options.thresholdCount) {
            this.#queue = [];
            return true;
        }

        if (looseCount + 1 >= this.#options.looseThresholdCount) {
            this.#queue = [];
            return true;
        }

        return false;
    }
}
