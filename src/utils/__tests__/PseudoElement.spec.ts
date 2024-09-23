import { HAPLOID_SCRIPT_TAG_NAME, createPseudoScriptElement } from '../../utils/PseudoElement';

describe.only('PseudoElement', () => {
    let script: ReturnType<typeof createPseudoScriptElement>;

    beforeEach(() => {
        script = createPseudoScriptElement();
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}> is not unknown element`, () => {
        const ele = document.createElement(HAPLOID_SCRIPT_TAG_NAME);
        expect(ele).not.toBeInstanceOf(HTMLUnknownElement);
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}> is not instance of HTMLScriptElement`, () => {
        // safari 18 does not support
        expect(script).not.toBeInstanceOf(HTMLScriptElement);
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s tagName is SCRIPT`, () => {
        expect(script.tagName).toBe('SCRIPT');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s nodeName is SCRIPT`, () => {
        expect(script.nodeName).toBe('SCRIPT');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s src can be set and read`, () => {
        // Default is empty string
        expect(script.src).toBe('');

        script.src = 'a.js';

        // With protocol
        expect(script.src).toBe(`${location.origin}${location.pathname}a.js`);

        script.src = '/a.js';

        expect(script.src).toBe(`${location.origin}/a.js`);
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s async`, () => {
        // Default is false
        expect(script.async).toBe(false);

        script.async = true;
        // https://github.com/jsdom/jsdom/issues/3407
        // expect(script.hasAttribute('async')).toBe(true);
        expect(script.async).toBe(true);

        script.async = false;
        expect(script.hasAttribute('async')).toBe(false);
        expect(script.async).toBe(false);
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s charset`, () => {
        // Default is false
        expect(script.charset).toBe('');

        script.charset = 'utf-8';
        expect(script.getAttribute('charset')).toBe('utf-8');
        expect(script.charset).toBe('utf-8');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s crossOrigin`, () => {
        // Default is null
        expect(script.crossOrigin).toBeNull();

        script.crossOrigin = 'illegal';
        // expect(script.getAttribute('crossOrigin')).toBe('illegal');
        // expect(script.crossOrigin).toBe('anonymous');

        script.crossOrigin = 'use-credentials';
        expect(script.getAttribute('crossOrigin')).toBe('use-credentials');
        expect(script.crossOrigin).toBe('use-credentials');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s defer`, () => {
        // Default is false
        expect(script.defer).toBe(false);

        script.defer = true;
        expect(script.hasAttribute('defer')).toBe(true);
        expect(script.defer).toBe(true);

        script.defer = false;
        expect(script.hasAttribute('defer')).toBe(false);
        expect(script.defer).toBe(false);
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s event`, () => {
        // Default is empty string.
        expect(script.event).toBe('');

        script.event = 'noop';
        expect(script.event).toBe('noop');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s htmlFor`, () => {
        // Default is empty string.
        expect(script.htmlFor).toBe('');

        script.htmlFor = 'noop';
        expect(script.htmlFor).toBe('noop');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s text`, () => {
        // Default is empty string.
        expect(script.text).toBe('');

        script.text = 'noop';
        expect(script.text).toBe('noop');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s integrity`, () => {
        // Default is empty string.
        expect(script.integrity).toBe('');

        script.integrity = 'abcd';
        // https://github.com/jsdom/jsdom/issues/3407
        // expect(script.getAttribute('integrity')).toBe('abcd');
        expect(script.integrity).toBe('abcd');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s noModule`, () => {
        // Default is false
        expect(script.noModule).toBe(false);

        script.noModule = true;
        // expect(script.hasAttribute('noModule')).toBe(true);
        expect(script.noModule).toBe(true);

        script.noModule = false;
        expect(script.hasAttribute('noModule')).toBe(false);
        expect(script.noModule).toBe(false);
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'s referrerPolicy`, () => {
        // Default is empty string.
        expect(script.referrerPolicy).toBe('');

        script.referrerPolicy = 'illegal';
        // https://github.com/jsdom/jsdom/issues/3407
        // expect(script.getAttribute('referrerPolicy')).toBe('illegal');
        // expect(script.referrerPolicy).toBe('illegal');

        script.referrerPolicy = 'no-referrer';
        // expect(script.getAttribute('referrerPolicy')).toBe('no-referrer');
        expect(script.referrerPolicy).toBe('no-referrer');
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'onload works`, () => {
        const onload = jest.fn();
        script.onload = onload;
        script.dispatchEvent(new Event('load'));

        expect(onload).toHaveBeenCalled();
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'onerror works`, () => {
        const onerror = jest.fn();
        script.onerror = onerror;
        script.dispatchEvent(new Event('error'));

        expect(onerror).toHaveBeenCalled();
    });

    it(`<${HAPLOID_SCRIPT_TAG_NAME}>'addEventListener works`, () => {
        const onerror = jest.fn();
        script.addEventListener('error', onerror);
        script.dispatchEvent(new Event('error'));

        expect(onerror).toHaveBeenCalled();
    });
});
