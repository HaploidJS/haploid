import { RouterContainer } from '@/index';

describe.only(`patch-history`, () => {
    const rawPush = history.pushState;
    const rawReplace = history.replaceState;

    it(`history patched only after run()`, () => {
        expect(history.pushState).toBe(rawPush);
        expect(history.replaceState).toBe(rawReplace);
        const container = new RouterContainer({
            name: 'root',
            root: '#app',
        });
        expect(history.pushState).toBe(rawPush);
        expect(history.replaceState).toBe(rawReplace);
        container.run();
        expect(history.pushState).not.toBe(rawPush);
        expect(history.replaceState).not.toBe(rawReplace);
    });
});
