import { getAvaliableCustomElementName } from './getAvaliableCustomElementName';
import { toAbsolutePath } from './url';

class HaploidScriptElement extends HTMLElement {}
class HaploidLinkElement extends HTMLElement {}

export const HAPLOID_SCRIPT_TAG_NAME = getAvaliableCustomElementName('haploid-script');
export const HAPLOID_LINK_TAG_NAME = getAvaliableCustomElementName('haploid-link');

window.customElements.define(HAPLOID_SCRIPT_TAG_NAME, HaploidScriptElement);
window.customElements.define(HAPLOID_LINK_TAG_NAME, HaploidLinkElement);

export function createPseudoScriptElement(props?: PropertyDescriptorMap): HTMLScriptElement {
    const script = document.createElement(HAPLOID_SCRIPT_TAG_NAME);

    script.hidden = true;

    let src: string | undefined = undefined;
    let async = false;
    let charset = '';
    let crossOrigin: null | string = null;
    let defer = false;
    let integrity = '';
    let type = '';
    let event = '';
    let htmlFor = '';
    let noModule = false;
    let referrerPolicy = '';

    Reflect.setPrototypeOf(
        script,
        Object.create(HaploidScriptElement.prototype, {
            constructor: { value: HTMLScriptElement, writable: true, enumerable: false, configurable: true },
            tagName: {
                get() {
                    return 'SCRIPT';
                },
                enumerable: true,
                configurable: true,
            },
            nodeName: {
                get() {
                    return 'SCRIPT';
                },
                enumerable: true,
                configurable: true,
            },
            src: {
                get() {
                    if ('undefined' === typeof src) return '';
                    return toAbsolutePath(src, script.baseURI);
                },
                set(val: string) {
                    script.setAttribute('src', (src = String(val)));
                },
                enumerable: true,
                configurable: true,
            },
            async: {
                get() {
                    return async;
                },
                set(asy: boolean) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.async = asy;
                    async = sc.async;
                    // https://github.com/jsdom/jsdom/issues/3407
                    const attrVal = sc.getAttribute('async');

                    if (attrVal !== null) {
                        script.setAttribute('async', attrVal);
                    } else {
                        script.removeAttribute('async');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            charset: {
                get() {
                    return charset;
                },
                set(char: string) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.charset = char;
                    charset = sc.charset;

                    const attrVal = sc.getAttribute('charset');
                    if (attrVal !== null) {
                        script.setAttribute('charset', attrVal);
                    } else {
                        script.removeAttribute('charset');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            crossOrigin: {
                get() {
                    return crossOrigin;
                },
                set(co: string) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.crossOrigin = co;
                    crossOrigin = sc.crossOrigin;

                    const attrVal = sc.getAttribute('crossOrigin');
                    if (attrVal !== null) {
                        script.setAttribute('crossOrigin', attrVal);
                    } else {
                        script.removeAttribute('crossOrigin');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            defer: {
                get() {
                    return defer;
                },
                set(def: boolean) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.defer = def;
                    defer = sc.defer;

                    const attrVal = sc.getAttribute('defer');
                    if (attrVal !== null) {
                        script.setAttribute('defer', attrVal);
                    } else {
                        script.removeAttribute('defer');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            event: {
                get() {
                    return event;
                },
                set(ev: string) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.event = ev;
                    event = sc.event;

                    const attrVal = sc.getAttribute('event');
                    if (attrVal !== null) {
                        script.setAttribute('event', attrVal);
                    } else {
                        script.removeAttribute('event');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            htmlFor: {
                get() {
                    return htmlFor;
                },
                set(hf: string) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.htmlFor = hf;
                    htmlFor = sc.htmlFor;

                    const attrVal = sc.getAttribute('for');
                    if (attrVal !== null) {
                        script.setAttribute('for', attrVal);
                    } else {
                        script.removeAttribute('for');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            text: {
                get() {
                    return Array.from(script.childNodes)
                        .filter(no => no.nodeType === Node.TEXT_NODE)
                        .map(no => no.textContent)
                        .join('');
                },
                set(te) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.text = te;
                    const t = document.createTextNode(sc.text);
                    script.appendChild(t);
                },
                enumerable: true,
                configurable: true,
            },
            integrity: {
                get() {
                    return integrity;
                },
                set(int: string) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.integrity = int;
                    integrity = sc.integrity;

                    const attrVal = sc.getAttribute('integrity');
                    if (attrVal !== null) {
                        script.setAttribute('integrity', attrVal);
                    } else {
                        script.removeAttribute('integrity');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            noModule: {
                get() {
                    return noModule;
                },
                set(nom: boolean) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.noModule = nom;

                    noModule = sc.noModule;

                    const attrVal = sc.getAttribute('noModule');
                    if (attrVal !== null) {
                        script.setAttribute('noModule', attrVal);
                    } else {
                        script.removeAttribute('noModule');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            referrerPolicy: {
                get() {
                    return referrerPolicy;
                },
                set(rp: string) {
                    // Correct it.
                    const sc = document.createElement('script');
                    sc.referrerPolicy = rp;

                    referrerPolicy = sc.referrerPolicy;
                    // https://github.com/jsdom/jsdom/issues/3407
                    const attrVal = sc.getAttribute('referrerPolicy');
                    if (attrVal !== null) {
                        script.setAttribute('referrerPolicy', attrVal);
                    } else {
                        script.removeAttribute('referrerPolicy');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            type: {
                get() {
                    return type;
                },
                set(t: string) {
                    type = String(t);
                    script.setAttribute('type', type);
                },
                enumerable: true,
                configurable: true,
            },
            ...props,
        })
    );

    return script as HTMLScriptElement;
}

export function createPseudoLinkElement(props?: PropertyDescriptorMap): HTMLLinkElement {
    const link = document.createElement(HAPLOID_LINK_TAG_NAME);

    link.hidden = true;

    let href: string | undefined = undefined;
    let crossOrigin: null | string = null;
    let integrity = '';
    let type = '';
    let rel = '';
    let as = '';
    let media = '';
    let referrerPolicy = '';
    let disabled = false;

    Reflect.setPrototypeOf(
        link,
        Object.create(HaploidLinkElement.prototype, {
            constructor: { value: HTMLLinkElement, writable: true, enumerable: false, configurable: true },
            tagName: {
                get() {
                    return 'LINK';
                },
                enumerable: true,
                configurable: true,
            },
            nodeName: {
                get() {
                    return 'LINK';
                },
                enumerable: true,
                configurable: true,
            },
            href: {
                get() {
                    if ('undefined' === typeof href) return '';
                    return toAbsolutePath(href, link.baseURI);
                },
                set(val: string) {
                    link.setAttribute('href', (href = String(val)));
                },
                enumerable: true,
                configurable: true,
            },
            crossOrigin: {
                get() {
                    return crossOrigin;
                },
                set(co: string) {
                    // Correct it.
                    const sc = document.createElement('link');
                    sc.crossOrigin = co;
                    crossOrigin = sc.crossOrigin;

                    const attrVal = sc.getAttribute('crossOrigin');
                    if (attrVal !== null) {
                        link.setAttribute('crossOrigin', attrVal);
                    } else {
                        link.removeAttribute('crossOrigin');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            rel: {
                get() {
                    return rel;
                },
                set(co: string) {
                    // Correct it.
                    const sc = document.createElement('link');
                    sc.rel = co;
                    rel = sc.rel;

                    const attrVal = sc.getAttribute('rel');
                    if (attrVal !== null) {
                        link.setAttribute('rel', attrVal);
                    } else {
                        link.removeAttribute('rel');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            as: {
                get() {
                    return as;
                },
                set(co: string) {
                    // Correct it.
                    const sc = document.createElement('link');
                    sc.as = co;
                    as = sc.as;

                    const attrVal = sc.getAttribute('as');
                    if (attrVal !== null) {
                        link.setAttribute('as', attrVal);
                    } else {
                        link.removeAttribute('as');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            media: {
                get() {
                    return media;
                },
                set(co: string) {
                    // Correct it.
                    const sc = document.createElement('link');
                    sc.media = co;
                    media = sc.media;

                    const attrVal = sc.getAttribute('media');
                    if (attrVal !== null) {
                        link.setAttribute('media', attrVal);
                    } else {
                        link.removeAttribute('media');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            disabled: {
                get() {
                    return disabled;
                },
                set(co: boolean) {
                    // Correct it.
                    const sc = document.createElement('link');
                    sc.disabled = co;
                    disabled = sc.disabled;

                    const attrVal = sc.getAttribute('disabled');
                    if (attrVal !== null) {
                        link.setAttribute('disabled', attrVal);
                    } else {
                        link.removeAttribute('disabled');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            integrity: {
                get() {
                    return integrity;
                },
                set(int: string) {
                    // Correct it.
                    const sc = document.createElement('link');
                    sc.integrity = int;
                    integrity = sc.integrity;

                    const attrVal = sc.getAttribute('integrity');
                    if (attrVal !== null) {
                        link.setAttribute('integrity', attrVal);
                    } else {
                        link.removeAttribute('integrity');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            referrerPolicy: {
                get() {
                    return referrerPolicy;
                },
                set(rp: string) {
                    // Correct it.
                    const sc = document.createElement('link');
                    sc.referrerPolicy = rp;

                    referrerPolicy = sc.referrerPolicy;
                    // https://github.com/jsdom/jsdom/issues/3407
                    const attrVal = sc.getAttribute('referrerPolicy');
                    if (attrVal !== null) {
                        link.setAttribute('referrerPolicy', attrVal);
                    } else {
                        link.removeAttribute('referrerPolicy');
                    }
                },
                enumerable: true,
                configurable: true,
            },
            type: {
                get() {
                    return type;
                },
                set(t: string) {
                    type = String(t);
                    link.setAttribute('type', type);
                },
                enumerable: true,
                configurable: true,
            },
            ...props,
        })
    );

    return link as HTMLLinkElement;
}
