import { getUniversalRouter } from '../../Router';
import { delay } from '../../../spec/test-utils';

describe.only(`patch-history`, () => {
    let rawPush: typeof history.pushState;
    let rawReplace: typeof history.replaceState;

    beforeAll(() => {
        rawPush = history.pushState;
        rawReplace = history.replaceState;
    });

    beforeEach(() => {
        history.pushState(null, '', '/');
    });

    afterEach(() => {
        history.pushState(null, '', '/');
    });

    it(`history patched only after getUniversalRouter()`, () => {
        expect(history.pushState).toBe(rawPush);
        expect(history.replaceState).toBe(rawReplace);
        getUniversalRouter();
        expect(history.pushState).not.toBe(rawPush);
        expect(history.replaceState).not.toBe(rawReplace);
    });

    it(`patched pushState works`, async () => {
        const stateA = { a: 1 };
        const stateB = { b: 2 };
        history.pushState(stateA, '', '/foo');
        history.pushState(stateB, '', '/bar');
        expect(location.pathname).toBe('/bar');
        expect(history.state).toBe(stateB);
        history.back();
        // history in JSOM is asynchronous
        await delay(10);
        expect(location.pathname).toBe('/foo');
        expect(history.state).toBe(stateA);
        history.forward();
        await delay(10);
        expect(location.pathname).toBe('/bar');
        expect(history.state).toBe(stateB);
    });

    it(`patched replaceState works`, async () => {
        const stateA = { a: 1 };
        const stateB = { b: 1 };
        history.pushState(stateA, '', '/foo');
        history.replaceState(stateB, '', '/bar');
        expect(location.pathname).toBe('/bar');
        expect(history.state).toBe(stateB);
        history.back();
        await delay(10);
        expect(location.pathname).not.toBe('/foo');
        expect(history.state).not.toBe(stateA);
        history.forward();
        await delay(10);
        expect(location.pathname).toBe('/bar');
        expect(history.state).toBe(stateB);
    });

    it(`pushState will trigger a popstate, but only when url changed`, () => {
        const onPopState = jest.fn();

        window.addEventListener('popstate', ({ state }) => onPopState(state));

        const stateA = { a: 1 };
        const stateB = { b: 1 };

        return Promise.resolve()
            .then(() => {
                history.pushState(stateA, '', '/foo');
                return delay(0);
            })
            .then(() => {
                expect(onPopState).toHaveBeenLastCalledWith(stateA);
                history.pushState(stateB, '', '/foo');
                return delay(0);
            })
            .then(() => {
                // "url" did not changed, do not fire popstate
                expect(onPopState).toHaveBeenCalledTimes(1);
                history.pushState(stateA, '', '/bar');
                return delay(0);
            })
            .then(() => {
                expect(onPopState).toHaveBeenCalledTimes(2);
            })
            .finally(() => {
                window.removeEventListener('popstate', onPopState);
            });
    });

    it(`replaceState will trigger a popstate, but only when url changed`, () => {
        const onPopState = jest.fn();

        window.addEventListener('popstate', ({ state }) => onPopState(state));

        const stateA = { a: 1 };
        const stateB = { b: 1 };

        return Promise.resolve()
            .then(() => {
                history.replaceState(stateA, '', '/foo');
                return delay(0);
            })
            .then(() => {
                expect(onPopState).toHaveBeenLastCalledWith(stateA);
                // again
                history.replaceState(stateB, '', '/foo');
                return delay(0);
            })
            .then(() => {
                // "url" did not changed, do not fire popstate
                expect(onPopState).toHaveBeenCalledTimes(1);
                history.replaceState(stateA, '', '/bar');
                return delay(0);
            })
            .then(() => {
                expect(onPopState).toHaveBeenCalledTimes(2);
            })
            .finally(() => {
                window.removeEventListener('popstate', onPopState);
            });
    });
});
