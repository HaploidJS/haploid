import { Atomic } from '../../Atomic';
import { delay } from '../../../spec/test-utils';

describe.only('wait-for', () => {
    it('promises run in sequence strictly', async () => {
        const atomic = new Atomic();
        const locker = {};

        const arr: string[] = [];
        const fn = jest.fn(d => arr.push(d));

        atomic.waitFor(locker, () => delay(200).then(() => fn('foo')));

        await atomic.waitFor(locker, () =>
            delay(0).then(() => {
                if (arr[0] === 'foo') fn('bar');
                else fn('baz');
            })
        );

        expect(arr).toEqual(['foo', 'bar']);
    });

    it("different lock object don't block each other", async () => {
        const atomic = new Atomic();

        const fn = jest.fn();

        const p1 = atomic.waitFor({}, () => delay(200).then(() => fn('foo')));

        const p2 = atomic.waitFor({}, () => delay(100).then(() => fn('bar')));

        await Promise.allSettled([p1, p2]);

        expect(fn).toHaveBeenNthCalledWith(1, 'bar');
        expect(fn).toHaveBeenNthCalledWith(2, 'foo');
    });

    it('respect capacity', async () => {
        const atomic = new Atomic(2);
        const lock = Object.create(null);

        const fn = jest.fn();

        atomic.waitFor(lock, () => delay(300).then(() => fn('foo')));
        atomic.waitFor(lock, () => delay(300).then(() => fn('bar')));

        const start = Date.now();
        await atomic.waitFor(lock, () => delay(0).then(() => fn('baz')));
        expect(Date.now() - start).toBeGreaterThanOrEqual(300);
    });
});
