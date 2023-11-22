import { MinesweeperQueue } from '../../MinesweeperQueue';

const minesweeperQueue = new MinesweeperQueue([{ isCanceled: false }]);

describe.only('instance', () => {
    it(`require at least one element for a new MinesweeperQueue"`, async () => {
        expect(() => new MinesweeperQueue([])).toThrow(/at least one element/);
    });

    it(`toString() is "[object MinesweeperQueue]"`, async () => {
        expect({}.toString.call(minesweeperQueue)).toBe('[object MinesweeperQueue]');
    });

    it(`String($instance) is "MinesweeperQueue"`, async () => {
        expect(String(minesweeperQueue)).toBe('MinesweeperQueue');
    });

    it(`$instance + 5 is "MinesweeperQueue5"`, async () => {
        // @ts-ignore test
        expect(minesweeperQueue + 5).toBe('MinesweeperQueue5');
    });
});
