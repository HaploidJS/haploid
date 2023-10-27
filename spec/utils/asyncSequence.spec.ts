import { asyncSequence } from '@/utils/asyncSequence';
import { delay } from '../test-utils';

describe.only('asyncSequence', () => {
    it('in sequence order', async () => {
        const fn = jest.fn();
        const counter = jest.fn();
        const fn1 = (...args: any[]): unknown => delay(400).then(() => fn('foo', ...args));
        const fn2 = (...args: any[]): unknown => delay(300).then(() => fn('bar', ...args));
        const fn3 = (...args: any[]): unknown => delay(200).then(() => fn('baz', ...args));
        await asyncSequence([fn1, fn2, fn3], ['dim'], null, counter);

        expect(fn).toHaveBeenNthCalledWith(1, 'foo', 'dim');
        expect(fn).toHaveBeenNthCalledWith(2, 'bar', 'dim');
        expect(fn).toHaveBeenNthCalledWith(3, 'baz', 'dim');

        expect(counter).toHaveBeenNthCalledWith(1, 0);
        expect(counter).toHaveBeenNthCalledWith(2, 1);
        expect(counter).toHaveBeenNthCalledWith(3, 2);
    });
});
