import { OneVoteVeto } from '@/utils/OneVoteVeto';

import { delay } from '../../../spec/test-utils';

describe.only('OneVoteVeto', () => {
    it('passed', async () => {
        const oneVoteVeto = new OneVoteVeto(3);

        const result = oneVoteVeto.isFinalVetoed();

        oneVoteVeto.getNextController().pass('c');
        oneVoteVeto.getNextController().pass('b');
        oneVoteVeto.getNextController().pass('a');
        await expect(result).resolves.toEqual(['c', 'b', 'a']);
    });

    it('vetod', async () => {
        const oneVoteVeto = new OneVoteVeto(3);
        const fn = jest.fn();
        const result = oneVoteVeto.isFinalVetoed().finally(fn);

        oneVoteVeto.getNextController().pass('c');
        oneVoteVeto.getNextController().pass('b');

        await delay(200);
        expect(fn).not.toHaveBeenCalled();
        oneVoteVeto.getNextController().veto();
        await delay(10); // immediately
        expect(fn).toHaveBeenCalled();
        await expect(result).resolves.toBe(true);
    });
});
