import { getUniversalUmdExportResolver } from '@/UmdExportResolver';

describe.only('instance', () => {
    it(`toString() is "[object UmdExportResolver]"`, async () => {
        expect({}.toString.call(getUniversalUmdExportResolver())).toBe('[object UmdExportResolver]');
    });
});
