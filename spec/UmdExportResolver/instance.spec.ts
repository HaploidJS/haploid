import { getUniversalGlobalExportResolver } from '@/GlobalExportResolver';

describe.only('instance', () => {
    it(`toString() is "[object GlobalExportResolver]"`, async () => {
        expect({}.toString.call(getUniversalGlobalExportResolver())).toBe('[object GlobalExportResolver]');
    });
});
