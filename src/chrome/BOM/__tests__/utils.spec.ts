import {
    createHTMLCollection,
    createHTMLAllCollection,
    createHTMLCollectionOf,
    createNodeListOf,
    createStyleSheetList,
    createDocumentRootElement,
} from '../utils';

describe.only('utils', () => {
    describe('createHTMLCollection', () => {
        it('create from ArrayLike', async () => {
            const tmp = document.createElement('div');
            tmp.innerHTML = `
                <div name="val0"></div>
                <div id="val1"></div>
            `;
            const params = Array.from(tmp.children) as HTMLElement[];

            const collection = createHTMLCollection(params);
            expect(collection).toBeInstanceOf(HTMLCollection);
            expect(collection).toHaveLength(2);
            let i = 0;
            for (const ele of collection) {
                expect(collection[i]).toStrictEqual(params[i]);
                expect(collection.item(i)).toStrictEqual(params[i]);
                expect(collection.namedItem(`val${i}`)).toStrictEqual(params[i]);
                expect(ele).toStrictEqual(params[i++]);
            }

            expect(collection.item(10000)).toBeNull();
            // @ts-ignore test
            expect(collection.item()).toBeNull();
            // @ts-ignore test
            expect(collection.item(null)).toBeNull();
        });
    });

    describe('createHTMLCollectionOf', () => {
        it('create from ArrayLike', async () => {
            const tmp = document.createElement('div');
            tmp.innerHTML = `
                <div name="val0"></div>
                <div id="val1"></div>
            `;
            const params = Array.from(tmp.children) as HTMLElement[];

            const collection = createHTMLCollectionOf(params);
            expect(collection).toHaveLength(2);
            // HTMLCollectionOf
            expect(collection).toBeInstanceOf(HTMLCollection);
            let i = 0;
            for (const ele of collection) {
                expect(collection[i]).toStrictEqual(params[i]);
                expect(collection.item(i)).toStrictEqual(params[i]);
                expect(collection.namedItem(`val${i}`)).toStrictEqual(params[i]);
                expect(ele).toStrictEqual(params[i++]);
            }

            expect(collection.item(10000)).toBeNull();
            // @ts-ignore test
            expect(collection.item()).toBeNull();
            // @ts-ignore test
            expect(collection.item(null)).toBeNull();
        });
    });
    describe('createNodeListOf', () => {
        it('create from ArrayLike', async () => {
            const tmp = document.createElement('div');
            tmp.innerHTML = `
                <div name="val0"></div>
                <div id="val1"></div>
            `;
            const params = Array.from(tmp.children) as HTMLElement[];

            const collection = createNodeListOf(params);
            expect(collection).toHaveLength(2);
            // NodeListOf
            expect(collection).toBeInstanceOf(NodeList);
            let i = 0;
            for (const ele of collection) {
                expect(collection[i]).toStrictEqual(params[i]);
                expect(collection.item(i)).toStrictEqual(params[i]);
                expect(ele).toStrictEqual(params[i++]);
            }

            collection.forEach((value, key, parent) => {
                expect(value).toStrictEqual(params[key]);
                expect(parent).toStrictEqual(collection);
            });

            expect(collection.item(10000)).toBeNull();
            // @ts-ignore test
            expect(collection.item()).toBeNull();
            // @ts-ignore test
            expect(collection.item(null)).toBeNull();
        });
    });
    describe('createHTMLAllCollection', () => {
        it('create from ArrayLike', async () => {
            const tmp = document.createElement('div');
            tmp.innerHTML = `
                <div name="val0"></div>
                <div name="val0"></div>
                <div id="val1"></div>
            `;
            const params = Array.from(tmp.children) as HTMLElement[];

            const collection = createHTMLAllCollection(params);
            if ('undefined' !== typeof HTMLAllCollection) expect(collection).toBeInstanceOf(HTMLAllCollection);
            expect(collection).toHaveLength(3);
            let i = 0;
            for (const ele of collection) {
                expect(collection[i]).toStrictEqual(params[i]);
                expect(collection.item(`${i}`)).toStrictEqual(params[i]);
                expect(ele).toStrictEqual(params[i++]);
            }

            expect(collection.item()).toBeNull();
            expect(collection.item('60000')).toBeNull();
            expect(collection.item(`val0`)).toHaveLength(2);
            expect(collection.item(`val0`)).toBeInstanceOf(HTMLCollection);
            expect(collection.item(`val1`)).toStrictEqual(params[2]);
        });
    });
    describe('createStyleSheetList', () => {
        it('create from ArrayLike', async () => {
            const tmp = document.createElement('div');
            tmp.innerHTML = `
                <style type="text/css">div {font-size:12px}</style>
                <style type="text/css">div {font-size:13px}</style>
                <style type="text/css">div {font-size:14px}</style>
            `;
            const params = Array.from(tmp.children) as HTMLStyleElement[];

            params.forEach(style => document.head.appendChild(style));

            const styleSheets = params.map(style => style.sheet).filter(Boolean) as CSSStyleSheet[];

            const collection = createStyleSheetList(styleSheets);
            expect(collection).toBeInstanceOf(StyleSheetList);
            expect(collection).toHaveLength(3);
            let i = 0;
            for (const ele of collection) {
                expect(collection[i]).toStrictEqual(styleSheets[i]);
                expect(collection.item(i)).toStrictEqual(styleSheets[i]);
                expect(ele).toStrictEqual(styleSheets[i++]);
            }

            params.forEach(style => document.head.removeChild(style));
        });
    });
    describe('createDocumentRootElement', () => {
        it('htmlElement/bodyElement/headElement/titleElement', () => {
            const {
                html: htmlElement,
                body: bodyElement,
                head: headElement,
                title: titleElement,
            } = createDocumentRootElement(document);

            expect(htmlElement.classList.contains('haploid-html')).toBe(true);
            expect(bodyElement.classList.contains('haploid-body')).toBe(true);
            expect(headElement.classList.contains('haploid-head')).toBe(true);
            expect(titleElement.classList.contains('haploid-title')).toBe(true);

            expect(htmlElement.firstElementChild).toStrictEqual(headElement);
            expect(headElement.firstElementChild).toStrictEqual(titleElement);
            expect(headElement.lastElementChild).toStrictEqual(titleElement);
            expect(htmlElement.lastElementChild).toStrictEqual(bodyElement);
        });

        it('htmlElement/bodyElement/headElement/titleElement act as real', () => {
            const {
                html: htmlElement,
                body: bodyElement,
                head: headElement,
                title: titleElement,
            } = createDocumentRootElement(document, {
                enableTitlePretending: true,
                enableHtmlPretending: true,
                enableBodyPretending: true,
                enableHeadPretending: true,
            });

            expect(htmlElement instanceof HTMLHtmlElement).toBe(true);
            expect(htmlElement.constructor).toStrictEqual(HTMLHtmlElement);
            expect(htmlElement.tagName.toLowerCase()).toBe('html');
            expect(htmlElement.nodeName.toLowerCase()).toBe('html');
            expect(Reflect.has(htmlElement, 'version')).toBe(true);
            expect(htmlElement.parentElement).toBeNull();
            expect(htmlElement.parentNode).toStrictEqual(document);

            expect(bodyElement instanceof HTMLBodyElement).toBe(true);
            expect(bodyElement.constructor).toStrictEqual(HTMLBodyElement);
            expect(bodyElement.tagName.toLowerCase()).toBe('body');
            expect(bodyElement.nodeName.toLowerCase()).toBe('body');
            expect(bodyElement.parentElement).toStrictEqual(htmlElement);
            expect(bodyElement.parentNode).toStrictEqual(htmlElement);

            expect(headElement instanceof HTMLHeadElement).toBe(true);
            expect(headElement.constructor).toStrictEqual(HTMLHeadElement);
            expect(headElement.tagName.toLowerCase()).toBe('head');
            expect(headElement.nodeName.toLowerCase()).toBe('head');
            expect(headElement.parentElement).toStrictEqual(htmlElement);
            expect(headElement.parentNode).toStrictEqual(htmlElement);

            expect(titleElement instanceof HTMLTitleElement).toBe(true);
            expect(titleElement.constructor).toStrictEqual(HTMLTitleElement);
            expect(titleElement.tagName.toLowerCase()).toBe('title');
            expect(titleElement.nodeName.toLowerCase()).toBe('title');
            expect(titleElement.parentElement).toStrictEqual(headElement);
            expect(titleElement.parentNode).toStrictEqual(headElement);

            (titleElement as HTMLTitleElement).text = 'A';
            const e = document.createElement('div');
            e.textContent = 'C';
            titleElement.appendChild(e);
            titleElement.appendChild(document.createTextNode('B'));

            // ignore non-Text
            expect((titleElement as HTMLTitleElement).text).toBe('AB');
        });

        it('htmlElement/bodyElement/headElement/titleElement do not act', () => {
            const {
                html: htmlElement,
                body: bodyElement,
                head: headElement,
                title: titleElement,
            } = createDocumentRootElement(document);

            const tmpRoot = document.createElement('div');
            tmpRoot.appendChild(htmlElement);

            expect(htmlElement instanceof HTMLElement).toBe(true);
            // expect(htmlElement.constructor).toStrictEqual(HTMLElement);
            expect(htmlElement.tagName.toLowerCase()).toBe('haploid-html');
            expect(htmlElement.nodeName.toLowerCase()).toBe('haploid-html');
            expect(Reflect.has(htmlElement, 'version')).toBe(false);
            expect(htmlElement.parentElement).toStrictEqual(tmpRoot);
            expect(htmlElement.parentNode).toStrictEqual(tmpRoot);

            expect(bodyElement instanceof HTMLElement).toBe(true);
            // expect(bodyElement.constructor).toStrictEqual(HTMLDivElement);
            expect(bodyElement.tagName.toLowerCase()).toBe('haploid-body');
            expect(bodyElement.nodeName.toLowerCase()).toBe('haploid-body');
            expect(bodyElement.parentElement).toStrictEqual(htmlElement);
            expect(bodyElement.parentNode).toStrictEqual(htmlElement);

            expect(headElement instanceof HTMLElement).toBe(true);
            // expect(headElement.constructor).toStrictEqual(HTMLDivElement);
            expect(headElement.tagName.toLowerCase()).toBe('haploid-head');
            expect(headElement.nodeName.toLowerCase()).toBe('haploid-head');
            expect(headElement.parentElement).toStrictEqual(htmlElement);
            expect(headElement.parentNode).toStrictEqual(htmlElement);

            expect(titleElement instanceof HTMLElement).toBe(true);
            // expect(titleElement.constructor).toStrictEqual(HTMLDivElement);
            expect(titleElement.tagName.toLowerCase()).toBe('haploid-title');
            expect(titleElement.nodeName.toLowerCase()).toBe('haploid-title');
            expect(titleElement.parentElement).toStrictEqual(headElement);
            expect(titleElement.parentNode).toStrictEqual(headElement);
        });
    });
});
