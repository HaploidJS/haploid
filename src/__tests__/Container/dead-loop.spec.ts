import { RouterContainer, navigateToUrl } from '@/index';
import { delay, createRoot, removeRoot } from '../../../spec/test-utils';

describe.only(`dead-loop`, () => {
    beforeEach(() => {
        navigateToUrl('/test');
        return delay(0);
    });

    it(`process dead loop`, async () => {
        const appA = createRoot('rootA');
        const appB = createRoot('rootB');
        let j = 0;

        const containerA = new RouterContainer({
            name: 'rootA',
            root: appA,
            fallbackUrl: '/foo',
            fallbackOnlyWhen: '/test',
        });

        containerA.registerApp({
            name: 'foo',
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
            activeWhen: '/foo',
        });

        const containerB = new RouterContainer({
            name: 'rootB',
            root: appB,
            fallbackUrl: '/test',
            fallbackOnlyWhen: (loc): boolean => {
                j += 1;
                return loc.pathname === '/foo';
            },
        });

        containerB.registerApp({
            name: 'test',
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
            activeWhen: '/test',
        });

        containerA.run();
        containerB.run();

        const onDeadloopDetected = jest.fn();

        containerB.router?.on('deadloopdetect', onDeadloopDetected);

        await delay(200);

        expect(j).toBeLessThanOrEqual(20);
        expect(onDeadloopDetected).toHaveBeenCalledTimes(1);

        removeRoot(appA);
        removeRoot(appB);
    });
});
