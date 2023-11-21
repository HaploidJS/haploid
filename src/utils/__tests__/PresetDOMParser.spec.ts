import { PresetDOMParser } from '@/utils/PresetDOMParser';

const { parseBodyElement, parseHeadElement } = PresetDOMParser;

describe('parseHeadElement', () => {
    it(`default is empty`, async () => {
        const ele = parseHeadElement('');
        expect(ele.childNodes.length).toBe(0);
    });

    it(`reserve outer comments or texts `, () => {
        const ele = parseHeadElement('<!--x--><div class="foo"></div>XX');
        expect((ele.firstChild as Comment)?.nodeValue).toBe('x');
        expect(ele.firstElementChild?.classList.contains('foo')).toBe(true);
        expect((ele.lastChild as Text)?.nodeValue).toEqual('XX');
    });

    it(`reserve inner comments or texts `, async () => {
        const ele = parseHeadElement('<div><!--x-->XX</div>');
        expect(ele.firstElementChild?.innerHTML).toBe('<!--x-->XX');
    });

    it(`all children are kept`, async () => {
        const ele = parseHeadElement('<meta><meta>');
        expect(ele.childElementCount).toBe(2);
    });

    it(`not throws if domWrapper is an unknown element`, async () => {
        expect(() => {
            parseHeadElement('<abcd></abcd>');
        }).not.toThrow();
    });

    it(`remove unsupported elements`, async () => {
        const ele = parseHeadElement('<script></script><html/><head/><body/><title/><base/><link/>');
        expect(ele.childElementCount).toBe(0);
    });

    it('remove unsupported meta', async () => {
        const ele = parseHeadElement(`
            <meta http-equiv="refresh">
            <meta http-equiv="X-Frame-Options">
            <meta http-equiv="Frame-Options">
            <meta http-equiv="X-Content-Security-Policy">
            <meta http-equiv="Content-Security-Policy">
            <meta name="viewport">
        `);
        expect(ele.childElementCount).toBe(0);
    });
});

describe('parseBodyElement', () => {
    it(`default is <div> with class haploid-app-root`, async () => {
        const ele = parseBodyElement('');
        expect(ele.firstElementChild?.tagName.toLowerCase()).toBe('div');
        expect(ele.firstElementChild?.classList.contains('haploid-app-root')).toBe(true);
    });

    it(`reserve outer comments or texts `, () => {
        const ele = parseBodyElement('<!--x--><div class="foo"></div>XX');
        expect((ele.firstChild as Comment)?.nodeValue).toBe('x');
        expect(ele.firstElementChild?.classList.contains('haploid-app-root')).toBe(true);
        expect(ele.firstElementChild?.classList.contains('foo')).toBe(true);
        expect((ele.lastChild as Text)?.nodeValue).toEqual('XX');
    });

    it(`reserve inner comments or texts `, async () => {
        const ele = parseBodyElement('<div><!--x-->XX</div>');
        expect(ele.firstElementChild?.innerHTML).toBe('<!--x-->XX');
    });

    it(`all children are kept`, async () => {
        const ele = parseBodyElement('<div></div><span></span>');
        expect(ele.childElementCount).toBe(2);
    });

    it(`not throws if domWrapper is an unknown element`, async () => {
        expect(() => {
            parseBodyElement('<abcd></abcd>');
        }).not.toThrow();
    });

    it(`remove unsupported elements`, async () => {
        const ele = parseBodyElement('<script></script><html/><head/><body/><title/><base/><meta>');
        expect(ele.childElementCount).toBe(1);
        expect(ele.firstElementChild?.nodeName.toLowerCase()).toBe('div');
    });

    it(`remove unsupported attributes(contenteditable, ^on)`, async () => {
        const ele = parseBodyElement(
            '<div contenteditable><span contenteditable onclick="javascript:alert()"></span></div>'
        );

        expect(ele.firstElementChild?.hasAttribute('contenteditable')).toBe(false);
        expect(ele.firstElementChild?.children[0].attributes).toHaveLength(0);
    });

    it('fix relative external URL', () => {
        const ele = parseBodyElement(
            `<div>
    <img src="./logo.png">
    <object data="a.pdf"></object>
    <source src="a.mp3"></source>
    <track src="a.mp3"></track>
    <a href="/a"></a>
    <area href="/a"></area>
    <audio src="a.mp3"></audio>
    <video src="a.mp4" poster="a.png"></video>
    <blockquote cite="a.html"></blockquote>
    <q cite="a.html"></q>
    <form action="/a"></form>
    <frame src="a.html"></frame>
    <iframe src="a.html"></iframe>
</div>`,
            'https://google.com'
        );
        expect(ele.firstElementChild?.querySelector('img')?.getAttribute('src')).toBe('https://google.com/logo.png');
        expect(ele.firstElementChild?.querySelector('object')?.getAttribute('data')).toBe('https://google.com/a.pdf');
        expect(ele.firstElementChild?.querySelector('source')?.getAttribute('src')).toBe('https://google.com/a.mp3');
        expect(ele.firstElementChild?.querySelector('track')?.getAttribute('src')).toBe('https://google.com/a.mp3');
        expect(ele.firstElementChild?.querySelector('a')?.getAttribute('href')).toBe('https://google.com/a');
        expect(ele.firstElementChild?.querySelector('area')?.getAttribute('href')).toBe('https://google.com/a');
        expect(ele.firstElementChild?.querySelector('audio')?.getAttribute('src')).toBe('https://google.com/a.mp3');
        expect(ele.firstElementChild?.querySelector('video')?.getAttribute('src')).toBe('https://google.com/a.mp4');
        expect(ele.firstElementChild?.querySelector('video')?.getAttribute('poster')).toBe('https://google.com/a.png');
        expect(ele.firstElementChild?.querySelector('blockquote')?.getAttribute('cite')).toBe(
            'https://google.com/a.html'
        );
        expect(ele.firstElementChild?.querySelector('q')?.getAttribute('cite')).toBe('https://google.com/a.html');
        expect(ele.firstElementChild?.querySelector('form')?.getAttribute('action')).toBe('https://google.com/a');
        // <frame> will be filtered by <template>
        // expect(ele.firstElementChild?.querySelector('frame')?.getAttribute('src')).toBe('https://google.com/a.html');
        expect(ele.firstElementChild?.querySelector('iframe')?.getAttribute('src')).toBe('https://google.com/a.html');
    });
});
