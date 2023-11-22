import { sanitizeActiveWhen } from '../../utils/sanitizeActiveWhen';

describe.only('sanitizeActiveWhen', () => {
    it('pathname activeWhen', async () => {
        expect(sanitizeActiveWhen('/active')(new URL('https://localhost/active/about'))).toBe(true);
    });

    it('hash activeWhen', async () => {
        expect(sanitizeActiveWhen('#/active')(new URL('https://localhost/cate/#/active/about'))).toBe(true);
    });
});
