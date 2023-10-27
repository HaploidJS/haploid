import { nativeWindow } from '../utils';
import { getAvaliableCustomElementName } from '../../utils/getAvaliableCustomElementName';

export function createHTMLCollection(elementsArgs: ArrayLike<Element>): HTMLCollection {
    const elements = Array.from(elementsArgs);
    const proto = Object.create(HTMLCollection.prototype, {
        [Symbol.iterator]: {
            value: function* () {
                for (let i = 0; i < elements.length; i += 1) {
                    yield elements[i];
                }
            },
            writable: true,
            configurable: true,
            enumerable: false,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (index: number): Element => Reflect.get(elements, index),
            configurable: true,
            enumerable: true,
            writable: true,
        },
    });

    const obj: HTMLCollection = Object.create(proto, {
        namedItem: {
            value: (name: string): Element | null => {
                if ('undefined' === typeof name || null === name) {
                    return null;
                }

                for (let i = 0; i < elements.length; ++i) {
                    if (elements[i].id === name || elements[i].getAttribute('name') === name) {
                        return elements[i];
                    }
                }

                return null;
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (index: number): Element | null => {
                return Reflect.get(elements, index) ?? null;
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
    });

    for (let i = 0; i < elements.length; ++i) {
        obj[i] = elements[i];
    }

    return obj;
}

export function createHTMLCollectionOf<T extends Element>(elementsArgs: ArrayLike<T>): HTMLCollectionOf<T> {
    const elements = Array.from(elementsArgs);
    const proto = Object.create(HTMLCollection.prototype, {
        [Symbol.iterator]: {
            value: function* () {
                for (let i = 0; i < elements.length; i += 1) {
                    yield elements[i];
                }
            },
            writable: true,
            configurable: true,
            enumerable: false,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (index: number): T => Reflect.get(elements, index),
            writable: true,
            configurable: true,
            enumerable: true,
        },
    });

    const obj: HTMLCollectionOf<T> = Object.create(proto, {
        namedItem: {
            value: (name: string): T | null => {
                if ('undefined' === typeof name || null === name) {
                    return null;
                }

                for (let i = 0; i < elements.length; ++i) {
                    if (elements[i].id === name || elements[i].getAttribute('name') === name) {
                        return elements[i];
                    }
                }

                return null;
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (index: number): T | null => {
                return Reflect.get(elements, index) ?? null;
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
    });

    for (let i = 0; i < elements.length; ++i) {
        obj[i] = elements[i];
    }

    return obj;
}

export function createNodeListOf<TNode extends Node>(elementsArgs: ArrayLike<TNode>): NodeListOf<TNode> {
    const elements = Array.from(elementsArgs);

    const proto = Object.create(NodeList.prototype, {
        [Symbol.iterator]: {
            value: function* () {
                for (let i = 0; i < elements.length; i += 1) {
                    yield elements[i];
                }
            },
            writable: true,
            configurable: true,
            enumerable: false,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (index: number): TNode => Reflect.get(elements, index),
            writable: true,
            configurable: true,
            enumerable: true,
        },
    });

    const obj: NodeListOf<TNode> = Object.create(proto, {
        item: {
            value: (index: number): TNode | null => {
                return Reflect.get(elements, index) ?? null;
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
        forEach: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value(callbackfn: (value: TNode, key: number, parent: NodeListOf<TNode>) => void, thisArg?: any): void {
                [].forEach.call(elements, (value: TNode, key: number) => {
                    callbackfn.call(thisArg, value, key, obj);
                });
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
    });

    for (let i = 0; i < elements.length; ++i) {
        obj[i] = elements[i];
    }

    return obj;
}

export function createHTMLAllCollection(elementsArgs: ArrayLike<Element>): HTMLAllCollection {
    const elements = Array.from(elementsArgs);
    const proto = Object.create('undefined' === typeof HTMLAllCollection ? null : HTMLAllCollection.prototype, {
        [Symbol.iterator]: {
            value: function* () {
                for (let i = 0; i < elements.length; i += 1) {
                    yield elements[i];
                }
            },
            writable: true,
            configurable: true,
            enumerable: false,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (index: number): Element => Reflect.get(elements, index),
            writable: true,
            configurable: true,
            enumerable: true,
        },
    });

    const obj: HTMLAllCollection = Object.create(proto, {
        namedItem: {
            value: (name: string): HTMLCollection | Element | null => {
                if ('undefined' === typeof name || null === name) {
                    return null;
                }

                const onlyOne = elements.find(ele => ele.id === name);

                if (onlyOne) return onlyOne;

                const nameMatched = elements.filter(ele => ele.getAttribute('name') === name);

                return nameMatched.length ? createHTMLCollection(nameMatched) : null;
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (nameOrIndex?: string): HTMLCollection | Element | null => {
                if ('undefined' === typeof nameOrIndex || null === nameOrIndex) {
                    return null;
                }

                if (/^\d+$/.test(nameOrIndex)) {
                    const index = parseInt(nameOrIndex);
                    return index < elements.length ? elements[index] : null;
                }

                const onlyOne = elements.find(ele => ele.id === nameOrIndex);

                if (onlyOne) return onlyOne;

                const nameMatched = elements.filter(ele => ele.getAttribute('name') === nameOrIndex);

                return nameMatched.length ? createHTMLCollection(nameMatched) : null;
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        length: {
            get() {
                return elements.length;
            },
            configurable: true,
            enumerable: true,
        },
    });

    for (let i = 0; i < elements.length; ++i) {
        obj[i] = elements[i];
    }

    return obj;
}

export function createStyleSheetList(styleSheetsArgs: ArrayLike<CSSStyleSheet>): StyleSheetList {
    const styleSheets = Array.from(styleSheetsArgs);
    const proto = Object.create(StyleSheetList.prototype, {
        [Symbol.iterator]: {
            value: function* () {
                for (let i = 0; i < styleSheets.length; i += 1) {
                    yield styleSheets[i];
                }
            },
            writable: true,
            configurable: true,
            enumerable: false,
        },
        length: {
            get() {
                return styleSheets.length;
            },
            configurable: true,
            enumerable: true,
        },
        item: {
            value: (index: number): CSSStyleSheet => Reflect.get(styleSheets, index),
            writable: true,
            configurable: true,
            enumerable: true,
        },
    });

    const obj: StyleSheetList = Object.create(proto, {
        item: {
            value: (index: number): CSSStyleSheet | null => {
                if ('undefined' === typeof index || null === index) {
                    return null;
                }

                return Reflect.get(styleSheets, index);
            },
            writable: true,
            configurable: true,
            enumerable: true,
        },
        length: {
            get() {
                return styleSheets.length;
            },
            configurable: true,
            enumerable: true,
        },
    });

    for (let i = 0; i < styleSheets.length; ++i) {
        obj[i] = styleSheets[i];
    }

    return obj;
}

type DocumentCreateMethods = {
    createDocumentFragment: 'createDocumentFragment';
    createElement: 'createElement';
    createComment: 'createComment';
    createElementNS: 'createElementNS';
    createAttribute: 'createAttribute';
    createAttributeNS: 'createAttributeNS';
    createTextNode: 'createTextNode';
};

export function createDocumentCreate<T extends keyof DocumentCreateMethods>(
    key: T
): (
    args: Parameters<Document[T]>,
    document: Document,
    properties?: Record<string, PropertyDescriptor>,
    proto?: object
) => ReturnType<Document[T]> {
    return (
        args: Parameters<Document[T]>,
        document: Document,
        properties: Record<string, PropertyDescriptor> = {},
        proto?: object
    ): ReturnType<Document[T]> => {
        const rawElement = Reflect.apply(nativeWindow.document[key], nativeWindow.document, args);

        Reflect.setPrototypeOf(
            rawElement,
            Object.create(proto ?? Reflect.getPrototypeOf(rawElement), {
                ownerDocument: {
                    configurable: true,
                    enumerable: true,
                    get(): Document {
                        return document;
                    },
                },
                baseURI: {
                    get() {
                        return document.baseURI;
                    },
                    enumerable: true,
                    configurable: true,
                },
                ...properties,
            })
        );

        return rawElement;
    };
}

export const createFakeTextNode = createDocumentCreate<'createTextNode'>('createTextNode');
export const createFakeElement = createDocumentCreate<'createElement'>('createElement');
export const createFakeDocumentFragment = createDocumentCreate<'createDocumentFragment'>('createDocumentFragment');
export const createFakeComment = createDocumentCreate<'createComment'>('createComment');
export const createFakeElementNS = createDocumentCreate<'createElementNS'>('createElementNS');
export const createFakeAttribute = createDocumentCreate<'createAttribute'>('createAttribute');
export const createFakeAttributeNS = createDocumentCreate<'createAttributeNS'>('createAttributeNS');

class HaploidHtmlElement extends HTMLElement {}
class HaploidHeadElement extends HTMLElement {}
class HaploidTitleElement extends HTMLElement {}
class HaploidBodyElement extends HTMLElement {}

export const HAPLOID_HTML_TAG_NAME = getAvaliableCustomElementName('haploid-html');
export const HAPLOID_HEAD_TAG_NAME = getAvaliableCustomElementName('haploid-head');
export const HAPLOID_TITLE_TAG_NAME = getAvaliableCustomElementName('haploid-title');
export const HAPLOID_BODY_TAG_NAME = getAvaliableCustomElementName('haploid-body');

const style = document.createElement('style');
style.textContent = `/*haploid global style*/${HAPLOID_HTML_TAG_NAME},${HAPLOID_BODY_TAG_NAME}{display:block}${HAPLOID_HEAD_TAG_NAME},${HAPLOID_TITLE_TAG_NAME}{display:none}`;
document.head.appendChild(style);

window.customElements.define(HAPLOID_HTML_TAG_NAME, HaploidHtmlElement);
window.customElements.define(HAPLOID_HEAD_TAG_NAME, HaploidHeadElement);
window.customElements.define(HAPLOID_TITLE_TAG_NAME, HaploidTitleElement);
window.customElements.define(HAPLOID_BODY_TAG_NAME, HaploidBodyElement);

export function createDocumentRootElement(
    document: Document,
    options: {
        enableHtmlPretending?: boolean;
        enableTitlePretending?: boolean;
        enableHeadPretending?: boolean;
        enableBodyPretending?: boolean;
    } = {}
): {
    html: HTMLElement;
    head: HTMLElement;
    title: HTMLElement;
    body: HTMLElement;
} {
    // html
    const htmlElement = !options.enableHtmlPretending
        ? document.createElement(HAPLOID_HTML_TAG_NAME)
        : createFakeElement(
              [HAPLOID_HTML_TAG_NAME],
              document,
              {
                  constructor: { value: HTMLHtmlElement, writable: true, enumerable: false, configurable: true },
                  tagName: {
                      get() {
                          return 'HTML';
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  nodeName: {
                      get() {
                          return 'HTML';
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  version: {
                      get() {
                          return '';
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  parentNode: {
                      get() {
                          return document;
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  parentElement: {
                      get() {
                          return null;
                      },
                      enumerable: true,
                      configurable: true,
                  },
              },
              HTMLHtmlElement.prototype
          );
    htmlElement.className = 'haploid-html';

    // head
    const headElement = !options.enableHeadPretending
        ? document.createElement(HAPLOID_HEAD_TAG_NAME)
        : createFakeElement(
              [HAPLOID_HEAD_TAG_NAME],
              document,
              {
                  constructor: { value: HTMLHeadElement, writable: true, enumerable: false, configurable: true },
                  tagName: {
                      get() {
                          return 'HEAD';
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  nodeName: {
                      get() {
                          return 'HEAD';
                      },
                      enumerable: true,
                      configurable: true,
                  },
              },
              HTMLHeadElement.prototype
          );
    headElement.className = 'haploid-head';

    // title
    const titleElement: HTMLElement = !options.enableTitlePretending
        ? document.createElement(HAPLOID_TITLE_TAG_NAME)
        : createFakeElement(
              [HAPLOID_TITLE_TAG_NAME],
              document,
              {
                  constructor: { value: HTMLTitleElement, writable: true, enumerable: false, configurable: true },
                  tagName: {
                      get() {
                          return 'TITLE';
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  nodeName: {
                      get() {
                          return 'TITLE';
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  text: {
                      get() {
                          return Array.from(titleElement.childNodes)
                              .filter((t: Node): t is Text => t.nodeType === Node.TEXT_NODE)
                              .map((t: Text) => t.wholeText)
                              .join('');
                      },
                      set(te: string) {
                          titleElement.textContent = te;
                      },
                      enumerable: true,
                      configurable: true,
                  },
              },
              HTMLTitleElement.prototype
          );
    titleElement.className = 'haploid-title';

    // body
    const bodyElement = !options.enableBodyPretending
        ? document.createElement(HAPLOID_BODY_TAG_NAME)
        : createFakeElement(
              [HAPLOID_BODY_TAG_NAME],
              document,
              {
                  constructor: { value: HTMLBodyElement, writable: true, enumerable: false, configurable: true },
                  tagName: {
                      get() {
                          return 'BODY';
                      },
                      enumerable: true,
                      configurable: true,
                  },
                  nodeName: {
                      get() {
                          return 'BODY';
                      },
                      enumerable: true,
                      configurable: true,
                  },
              },
              HTMLBodyElement.prototype
          );
    bodyElement.className = 'haploid-body';

    headElement.appendChild(titleElement);
    htmlElement.appendChild(headElement);
    htmlElement.appendChild(bodyElement);

    return {
        html: htmlElement,
        head: headElement,
        title: titleElement,
        body: bodyElement,
    };
}
