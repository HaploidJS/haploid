import { patchEventListener } from '../patchEventListener';

describe.only('patchEventListener', () => {
    it('addEventListener/removeEventListener work', () => {
        const fakeDocument = new Proxy(document, {});
        const { addEventListener, removeEventListener, destroy } = patchEventListener<Document>(fakeDocument, document);
        const onTest = jest.fn();

        addEventListener.call(fakeDocument, 'test', onTest);
        document.dispatchEvent(new CustomEvent('test'));
        expect(onTest).toHaveBeenCalledTimes(1);
        removeEventListener.call(fakeDocument, 'test', onTest);
        document.dispatchEvent(new CustomEvent('test'));
        expect(onTest).toHaveBeenCalledTimes(1); // still 1

        destroy();
    });

    it('respect capture', () => {
        const fakeDocument = new Proxy(document, {});
        const { addEventListener, removeEventListener, destroy } = patchEventListener<Document>(fakeDocument, document);
        const onTest = jest.fn();

        addEventListener.call(fakeDocument, 'test', onTest, true);
        removeEventListener.call(fakeDocument, 'test', onTest, false); // should not be removed
        document.dispatchEvent(new CustomEvent('test'));
        expect(onTest).toHaveBeenCalledTimes(1);

        removeEventListener.call(fakeDocument, 'test', onTest); // should not be removed
        document.dispatchEvent(new CustomEvent('test'));
        expect(onTest).toHaveBeenCalledTimes(2);

        removeEventListener.call(fakeDocument, 'test', onTest, {
            capture: true,
        }); // should be removed
        document.dispatchEvent(new CustomEvent('test'));
        expect(onTest).toHaveBeenCalledTimes(2);

        destroy();
    });

    it('this context', () => {
        const fakeDocument = new Proxy(document, {});
        const { addEventListener, destroy } = patchEventListener<Document>(fakeDocument, document);

        const thisArr: unknown[] = [];
        const onTest = jest.fn(function () {
            thisArr.push(this);
        });
        addEventListener('fooevent', onTest);
        const objLis = {
            handleEvent: onTest,
        };
        addEventListener('fooevent', objLis);
        document.dispatchEvent(new Event('fooevent'));

        expect(onTest).toHaveBeenCalledTimes(2);
        expect(thisArr[0]).toBe(fakeDocument);
        expect(thisArr[1]).toBe(objLis);

        destroy();
    });

    it('destroy removes all listeners', () => {
        const fakeDocument = new Proxy(document, {});
        const { addEventListener, destroy } = patchEventListener<Document>(fakeDocument, document);
        const onTest = jest.fn();

        addEventListener.call(fakeDocument, 'test', onTest);
        document.dispatchEvent(new CustomEvent('test'));
        expect(onTest).toHaveBeenCalledTimes(1);

        destroy();

        document.dispatchEvent(new CustomEvent('test'));
        expect(onTest).toHaveBeenCalledTimes(1); // still 1
    });
});
