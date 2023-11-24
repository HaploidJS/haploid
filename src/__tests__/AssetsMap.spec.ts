import { fillAssetsMap } from '../AssetsMap';

describe.only('AssetsMap', () => {
    it('default module is "umd"', () => {
        const am = fillAssetsMap({});
        expect(am).toMatchObject({ module: 'umd' });
    });

    it('keep unknown module is', () => {
        const am = fillAssetsMap({
            // @ts-ignore test
            module: 'unknown',
        });
        expect(am).toMatchObject({ module: 'unknown' });
    });

    it('fill css&js', async () => {
        const am = fillAssetsMap({});
        expect(am).toMatchObject({
            initial: { css: [], js: [] },
            async: { css: [], js: [] },
        });
    });

    it('throws if not string in css/js', async () => {
        expect(() =>
            fillAssetsMap({
                initial: {
                    // @ts-ignore test
                    css: [2],
                },
            })
        ).toThrow();
    });
});
