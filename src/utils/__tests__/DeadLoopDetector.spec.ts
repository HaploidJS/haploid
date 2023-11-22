import { DeadLoopDetector } from '../../utils/DeadLoopDetector';

describe.only(`smells-dead`, () => {
    it(`smells a repeat loop`, async () => {
        const deadLoopDetector = new DeadLoopDetector<string>({
            thresholdCount: 10,
            duration: 100,
        });

        const asyncIterable = {
            [Symbol.asyncIterator]: async function* (): AsyncGenerator<string> {
                for (let i = 0; i < 9; i += 1) {
                    yield 'A';
                }
            },
        };

        for await (const k of asyncIterable) {
            deadLoopDetector.smellsLikeDead(k);
        }

        expect(deadLoopDetector.smellsLikeDead('A')).toBe(true);
    });

    it(`smells a alternate loop`, async () => {
        const deadLoopDetector = new DeadLoopDetector<string>({
            thresholdCount: 10,
            duration: 100,
        });

        const asyncIterable = {
            [Symbol.asyncIterator]: async function* (): AsyncGenerator<string> {
                for (let i = 0; i < 18; i += 1) {
                    yield i & 1 ? 'A' : 'B';
                }
            },
        };

        for await (const k of asyncIterable) {
            deadLoopDetector.smellsLikeDead(k);
        }

        expect(deadLoopDetector.smellsLikeDead('B')).toBe(true);
    });

    it(`smells a loose loop`, async () => {
        const deadLoopDetector = new DeadLoopDetector<string>({
            thresholdCount: 30,
            looseThresholdCount: 20,
            duration: 100,
        });

        const asyncIterable = {
            [Symbol.asyncIterator]: async function* (): AsyncGenerator<string> {
                for (let i = 0; i < 19; i += 1) {
                    yield i & 1 ? 'A' : 'B';
                }
            },
        };

        for await (const k of asyncIterable) {
            deadLoopDetector.smellsLikeDead(k);
        }

        expect(deadLoopDetector.smellsLikeDead('B')).toBe(true);
    });
});
