import { toAbsolutePath } from '../../utils/url';

describe('toAbsolutePath', () => {
    it('relative path works', () => {
        expect(toAbsolutePath('a.js', 'https://google.com/test/')).toBe('https://google.com/test/a.js');
    });

    it('absolute path works', () => {
        expect(toAbsolutePath('/a.js', 'https://google.com/test/')).toBe('https://google.com/a.js');
    });

    it('default to current location', () => {
        expect(toAbsolutePath('/a.js')).toBe(`${location.origin}/a.js`);
        // @ts-ignore test
        expect(toAbsolutePath('/a.js', undefined)).toBe(`${location.origin}/a.js`);
        // @ts-ignore test
        expect(toAbsolutePath('/a.js', null)).toBe(`${location.origin}/a.js`);
        expect(toAbsolutePath('/a.js', '')).toBe(`${location.origin}/a.js`);
        // @ts-ignore test
        expect(toAbsolutePath('/a.js', 0)).toBe(`${location.origin}/a.js`);
    });
});
