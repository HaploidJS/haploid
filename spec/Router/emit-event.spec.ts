import { getUniversalRouter } from '@/Router';
import { navigateToUrl } from '@/index';
import { delay } from '../test-utils';

describe.only(`emit-event`, () => {
    it(`emit deadloopdetect`, async () => {
        const onDeadloopDetected = jest.fn();
        const onDeadloopDetectedOnce = jest.fn();
        getUniversalRouter().on('deadloopdetect', onDeadloopDetected).once('deadloopdetect', onDeadloopDetectedOnce);

        const asyncIterable = {
            [Symbol.asyncIterator]: async function* (): AsyncGenerator<string> {
                for (let i = 0; i < 40; i += 1) {
                    await delay(0);
                    yield i & 1 ? '/foo' : '/bar';
                }
            },
        };

        for await (const _ of asyncIterable) {
            navigateToUrl(_);
        }

        expect(onDeadloopDetected).toBeCalledTimes(1);
        expect(onDeadloopDetectedOnce).toBeCalledTimes(1);

        getUniversalRouter().off('deadloopdetect', onDeadloopDetected);
    });
});
