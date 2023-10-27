import { getUniversalUmdExportResolver } from '@/UmdExportResolver';
import { uuid } from '../test-utils';

describe.only('resolve', () => {
    it('resolved', async () => {
        const key = uuid();

        const resolvedKey = getUniversalUmdExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        expect(resolvedKey).toEqual(key);
    });

    it('resolved failed', async () => {
        const key = uuid();

        expect(() => getUniversalUmdExportResolver().resolve(() => {}, `${key}.js`)).toThrow(
            /Cannot find UMD exported object in/
        );
    });

    it('resolved repeatly if src equals', async () => {
        const key = uuid();

        const resolvedKey1 = getUniversalUmdExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        const resolvedKey2 = getUniversalUmdExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        // from cache
        expect(resolvedKey1).toEqual(resolvedKey2);
    });

    it('resolved repeatly failed if src not equals', async () => {
        const key = uuid();

        getUniversalUmdExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        expect(() =>
            getUniversalUmdExportResolver().resolve(() => {
                Reflect.set(window, key, 1);
            }, `${key}-2.js`)
        ).toThrow(/Cannot find UMD exported object in/);
    });
});
