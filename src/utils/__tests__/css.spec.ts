import { fixCssUrl } from '@/utils/css';
import { compressCSS } from '../../../spec/test-utils';

const sourceURL = `https://google.com/test/base.css`;

async function localFixCSS(input: string): Promise<string> {
    return compressCSS(fixCssUrl(input, sourceURL));
}

describe.only('css', () => {
    it('remove empty @charset', async () => {
        await expect(localFixCSS(`@charset "utf8";`)).resolves.toBe('');
        await expect(localFixCSS(`@charset 'gbk';`)).resolves.toBe('');
        await expect(localFixCSS(`@charset '';`)).resolves.toBe('');
        await expect(localFixCSS(`@charset ' ';`)).resolves.toBe('');
    });

    it('remove empty @import', async () => {
        await expect(localFixCSS(`@import '';`)).resolves.toBe('');
        await expect(localFixCSS(`@import " ";`)).resolves.toBe('');
    });

    it('convert @import "" to @import url("")', async () => {
        await expect(localFixCSS(`@import 'a.css';`)).resolves.toBe(`@import url('https://google.com/test/a.css');`);
        await expect(localFixCSS(`@import "a.css";`)).resolves.toBe(`@import url("https://google.com/test/a.css");`);
    });

    it('leave empty/hash url like url("") or url("#a")', async () => {
        expect(fixCssUrl(`@import url();`, sourceURL)).toBe(`@import url();`);

        expect(fixCssUrl(`@import url(#a);`, sourceURL)).toBe(`@import url(#a);`);
        expect(fixCssUrl(`@import url('#a');`, sourceURL)).toBe(`@import url('#a');`);
        expect(fixCssUrl(`@import url("#a");`, sourceURL)).toBe(`@import url("#a");`);

        expect(fixCssUrl(`@import url('');`, sourceURL)).toBe(`@import url('');`);
        expect(fixCssUrl(`@import url(' ');`, sourceURL)).toBe(`@import url(' ');`);
        expect(fixCssUrl(`@import url("");`, sourceURL)).toBe(`@import url("");`);
        expect(fixCssUrl(`@import url(" ");`, sourceURL)).toBe(`@import url(" ");`);
    });

    it('join path', async () => {
        expect(fixCssUrl(`@import url(about:blank);`, sourceURL)).toBe(`@import url(about:blank);`);
        expect(fixCssUrl(`@import url(data:1234);`, sourceURL)).toBe(`@import url(data:1234);`);
        expect(fixCssUrl(`@import url(a.css);`, sourceURL)).toBe(`@import url(https://google.com/test/a.css);`);
        expect(fixCssUrl(`@import url(/a.css);`, sourceURL)).toBe(`@import url(https://google.com/a.css);`);
        expect(fixCssUrl(`@import url('/a.css');`, sourceURL)).toBe(`@import url('https://google.com/a.css');`);
        expect(fixCssUrl(`@import url("/a.css");`, sourceURL)).toBe(`@import url("https://google.com/a.css");`);
    });

    it('strip whitespace', async () => {
        expect(fixCssUrl(`@import url( /a.css);`, sourceURL)).toBe(`@import url(https://google.com/a.css);`);
        expect(fixCssUrl(`@import url(' /a.css');`, sourceURL)).toBe(`@import url('https://google.com/a.css');`);
        expect(fixCssUrl(`@import url(" /a.css");`, sourceURL)).toBe(`@import url("https://google.com/a.css");`);
    });

    it('fix url() other than @import', async () => {
        expect(fixCssUrl(`background-image: url("a.jpg");`, sourceURL)).toBe(
            `background-image: url("https://google.com/test/a.jpg");`
        );
        expect(fixCssUrl(`background-image: image-set(url("a.jpg") type("image/jpeg"));`, sourceURL)).toBe(
            `background-image: image-set(url("https://google.com/test/a.jpg") type("image/jpeg"));`
        );
    });

    it('cannot fix image-set without url()', async () => {
        expect(fixCssUrl(`background-image: image-set("a.jpg" type("image/jpeg"));`, sourceURL)).toBe(
            `background-image: image-set("a.jpg" type("image/jpeg"));`
        );
    });

    // dropStyleSheetWay is nothing for jsdom
    it.skip('repsect dropStyleSheetWay', async () => {
        // expect(fixCssUrl(`/*url("a.jpg")*/);`, sourceURL, false)).toBe(``);
        expect(fixCssUrl(`/*url("a.jpg")*/`, sourceURL, true)).toBe(`/*url("https://google.com/test/a.jpg")*/`);
    });
});
