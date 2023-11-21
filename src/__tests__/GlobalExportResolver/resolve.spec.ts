import { getUniversalGlobalExportResolver } from '@/GlobalExportResolver';
import { uuid } from '../../../spec/test-utils';

describe.only('resolve', () => {
    it('resolved', async () => {
        const key = uuid();

        const resolvedKey = getUniversalGlobalExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        expect(resolvedKey).toEqual(key);
    });

    it('resolved failed', async () => {
        const key = uuid();

        expect(() => getUniversalGlobalExportResolver().resolve(() => {}, `${key}.js`)).toThrow(
            /Cannot find global exported object in/
        );
    });

    it('resolved repeatly if src equals', async () => {
        const key = uuid();

        const resolvedKey1 = getUniversalGlobalExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        const resolvedKey2 = getUniversalGlobalExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        // from cache
        expect(resolvedKey1).toEqual(resolvedKey2);
    });

    it('resolved repeatly failed if src not equals', async () => {
        const key = uuid();

        getUniversalGlobalExportResolver().resolve(() => {
            Reflect.set(window, key, 1);
        }, `${key}.js`);

        expect(() =>
            getUniversalGlobalExportResolver().resolve(() => {
                Reflect.set(window, key, 1);
            }, `${key}-2.js`)
        ).toThrow(/Cannot find global exported object in/);
    });
});
