import { MinesweeperQueue } from '@/MinesweeperQueue';

interface Fake {
    isCanceled?: boolean;
    name: string;
}

describe.only('add-cancel-confirm', () => {
    let minesweeperQueue: MinesweeperQueue<Fake>;
    beforeEach(() => {
        minesweeperQueue = new MinesweeperQueue<Fake>([{ name: 'initial', isCanceled: false }]);
    });

    it(`top update strictly`, async () => {
        const ele = { name: 'foo' };
        minesweeperQueue.add(ele);
        expect(minesweeperQueue.top).toStrictEqual(ele);
    });

    it(`confirmElement clear all elements on the left side`, async () => {
        const foo = { name: 'foo' };
        const bar = { name: 'bar' };
        const baz = { name: 'baz' };
        minesweeperQueue.add(foo);
        minesweeperQueue.add(bar);
        minesweeperQueue.add(baz);

        minesweeperQueue.confirmElement(baz);
        expect(minesweeperQueue.top).toStrictEqual(baz);
    });

    it(`cancelElement clear all canceled elements on the right side`, async () => {
        const foo = { name: 'foo' };
        const bar = { name: 'bar' };
        const baz = { name: 'baz' };
        minesweeperQueue.add(foo);
        minesweeperQueue.add(bar);
        minesweeperQueue.add(baz);

        minesweeperQueue.cancelElement(foo);
        minesweeperQueue.cancelElement(bar);
        expect(minesweeperQueue.top).toStrictEqual(baz);
        minesweeperQueue.cancelElement(baz);
        expect(minesweeperQueue.top.name).toBe('initial');
    });
});
