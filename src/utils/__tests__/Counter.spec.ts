import { Counter } from '../../utils/Counter';
import { delay } from '../../../spec/test-utils';

describe.only('Counter', () => {
    it('reached', async () => {
        let num = 4;
        const counter = new Counter(num);

        const reached = jest.fn();

        counter.whenReached().then(reached);

        while (--num) counter.getNextController().count();

        await delay(200);
        expect(reached).not.toHaveBeenCalled();

        await counter.getNextController().count();

        expect(reached).toHaveBeenCalled();
    });
});
