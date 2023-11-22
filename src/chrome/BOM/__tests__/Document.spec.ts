import { DocumentNode } from '../Document';
import { WindowNode } from '../Window';
import { delay } from '../../../../spec/test-utils';

describe.only('Document', () => {
    let doc: DocumentNode;
    let win: WindowNode;
    beforeEach(() => {
        win = new WindowNode(
            'test',
            {},
            {
                enableBodyPretending: true,
                enableHeadPretending: true,
                enableHtmlPretending: true,
                enableTitlePretending: true,
                lastModified: 'Wed, 18 Jan 2023 08:13:06 GMT',
            }
        );
        doc = win.documentNode;
    });
    afterEach(() => win.onDestroy());

    it('node is an instance of Document', () => {
        expect(doc.node.constructor).toStrictEqual(Document);
        expect(doc.node).toBeInstanceOf(Document);
    });

    it("node' constructor is Document", () => {
        expect(doc.node.constructor).toStrictEqual(Document);
    });

    it('write/writeln is noop', async () => {
        doc.node.write('foo');
        doc.node.writeln('foo');
        await delay(0);
        expect(document.documentElement.innerHTML).not.toContain('foo');
    });

    it('open/close is noop', async () => {
        doc.node.open();
        doc.node.close();
        await delay(0);
        expect(document.documentElement.innerHTML).toContain('app');
    });

    it('replaceChildren is noop', async () => {
        doc.node.replaceChildren();
        await delay(0);
        expect(document.documentElement.innerHTML).toContain('app');
    });

    it('getElementsById queries from descendants of htmlElement', () => {
        doc.bodyElement.innerHTML = `<div><div id="foo" name="foo"></div></div>`;
        expect(doc.node.getElementById('foo')?.getAttribute('name')).toBe('foo');
        expect(doc.node.getElementById('bar')).toBeNull();
    });

    it('getElementsByClassName queries from descendants of htmlElement', () => {
        doc.bodyElement.innerHTML = `<div><div class="foo" id="foo-1"></div></div><div class="foo" name="foo-2"></div>`;
        const eles = doc.node.getElementsByClassName('foo');
        expect(eles).toHaveLength(2);
        // iterator
        for (const ele of eles) expect(ele.classList.contains('foo')).toBe(true);

        // It's a HTMLCollection.
        expect(eles.namedItem('foo-1')?.id).toBe('foo-1');
        expect(eles.namedItem('foo-2')?.getAttribute('name')).toBe('foo-2');
        expect(eles.item(0)).toStrictEqual(eles[0]);
        expect(eles.item(1)).toStrictEqual(eles[1]);
    });

    it('getElementsByTagName queries from descendants of htmlElement', () => {
        doc.bodyElement.innerHTML = `<div><span class="foo" id="foo-1"></span></div><span class="foo" name="foo-2"></span>`;
        const eles = doc.node.getElementsByTagName('span');
        expect(eles).toHaveLength(2);
        // iterator
        for (const ele of eles) expect(ele.tagName.toLowerCase()).toBe('span');

        // It's a HTMLCollection.
        expect(eles.namedItem('foo-1')?.id).toBe('foo-1');
        expect(eles.namedItem('foo-2')?.getAttribute('name')).toBe('foo-2');
        expect(eles.item(0)).toStrictEqual(eles[0]);
        expect(eles.item(1)).toStrictEqual(eles[1]);
    });

    it('getElementsByTagName("html") returns htmlElement', () => {
        expect(doc.node.getElementsByTagName('html').item(0)).toBe(doc.htmlElement);
    });

    it('getElementsByTagName("title") returns titleElement', () => {
        expect(doc.node.getElementsByTagName('title').item(0)).toBe(doc.titleElement);
    });

    it('getElementsByTagName("head") returns headElement', () => {
        expect(doc.node.getElementsByTagName('head').item(0)).toBe(doc.headElement);
    });

    it('getElementsByTagName("body") returns bodyElement', () => {
        expect(doc.node.getElementsByTagName('body').item(0)).toBe(doc.bodyElement);
    });

    it('querySelector queries from descendants of htmlElement', () => {
        doc.bodyElement.innerHTML = `<div><table></table></div>`;
        expect(doc.node.querySelector('table')).toStrictEqual(doc.htmlElement.querySelector('table'));
    });

    it('querySelector("html") returns htmlElement', () => {
        expect(doc.node.querySelector('html')).toBe(doc.htmlElement);
    });

    it('querySelector("title") returns titleElement', () => {
        expect(doc.node.querySelector('title')).toBe(doc.titleElement);
    });

    it('querySelector("head") returns headElement', () => {
        expect(doc.node.querySelector('head')).toBe(doc.headElement);
    });

    it('querySelector("body") returns bodyElement', () => {
        expect(doc.node.querySelector('body')).toBe(doc.bodyElement);
    });

    it('querySelectorAll queries from descendants of htmlElement', () => {
        doc.bodyElement.innerHTML = `<div><legend></legend></div><legend></legend>`;
        expect(doc.node.querySelectorAll('legend')).toHaveLength(2);
    });

    it('querySelectorAll("html") returns htmlElement', () => {
        expect(doc.node.querySelectorAll('html').item(0)).toBe(doc.htmlElement);
    });

    it('querySelectorAll("title") returns titleElement', () => {
        expect(doc.node.querySelectorAll('title').item(0)).toBe(doc.titleElement);
    });

    it('querySelectorAll("head") returns headElement', () => {
        expect(doc.node.querySelectorAll('head').item(0)).toBe(doc.headElement);
    });

    it('querySelectorAll("body") returns bodyElement', () => {
        expect(doc.node.querySelectorAll('body').item(0)).toBe(doc.bodyElement);
    });

    it('getElementsByTagNameNS queries from descendants of htmlElement', () => {
        doc.bodyElement.innerHTML = `<div><legend></legend></div><legend></legend>`;
        expect(doc.node.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'legend')).toHaveLength(2);
    });

    it('new element created by createElement has a ownerDocument', () => {
        expect(doc.node.createElement('i').ownerDocument).toStrictEqual(doc.node);
    });

    it('new element created by createElementNS has a ownerDocument', () => {
        expect(doc.node.createElementNS('http://www.w3.org/1999/xhtml', 'i').ownerDocument).toStrictEqual(doc.node);
    });

    it('new Comment created by createComment has a ownerDocument', () => {
        expect(doc.node.createComment('').ownerDocument).toStrictEqual(doc.node);
    });

    it('new DocumentFragment created by createDocumentFragment has a ownerDocument', () => {
        expect(doc.node.createDocumentFragment().ownerDocument).toStrictEqual(doc.node);
    });

    it('new Attribute created by createAttribute has a ownerDocument', () => {
        expect(doc.node.createAttribute('name').ownerDocument).toStrictEqual(doc.node);
    });

    it('new Attribute created by createAttributeNS has a ownerDocument', () => {
        expect(doc.node.createAttributeNS('http://www.w3.org/1999/xhtml', 'name').ownerDocument).toStrictEqual(
            doc.node
        );
    });

    it('new Text created by createTextNode has a ownerDocument', () => {
        expect(doc.node.createTextNode('').ownerDocument).toStrictEqual(doc.node);
    });

    it('defaultView is window', () => {
        expect(doc.node.defaultView).toStrictEqual(win.node);
    });

    it('documentElement is htmlElement', () => {
        expect(doc.node.documentElement).toStrictEqual(doc.htmlElement);
    });

    it("title refers to <title>'text", () => {
        // Default is empty string.
        expect(doc.node.title).toBe('');
        doc.node.title = 'foo';

        expect(doc.node.title).toBe('foo');
        expect(doc.titleElement.textContent).toBe('foo');

        doc.titleElement.textContent = 'bar';
        expect(doc.node.title).toBe('bar');
    });

    it('head is headElement', () => {
        expect(doc.node.head).toStrictEqual(doc.headElement);
        expect(doc.node.head.ownerDocument).toStrictEqual(doc.node);
    });

    it('body is bodyElement', () => {
        expect(doc.node.body).toStrictEqual(doc.bodyElement);
        expect(doc.node.body.ownerDocument).toStrictEqual(doc.node);
    });

    it('all includes all elements', () => {
        const all = doc.node.all;
        expect(all).toHaveLength(4);
        expect(all.item('0')).toStrictEqual(doc.htmlElement);
        expect(all.item('1')).toStrictEqual(doc.headElement);
        expect(all.item('2')).toStrictEqual(doc.titleElement);
        expect(all.item('3')).toStrictEqual(doc.bodyElement);
    });

    it('forms includes all <form>', () => {
        doc.bodyElement.innerHTML = `<div><form id="form-1"></form></div><form id="form-2" name="alias-2"></form>`;
        // HTMLCollectionOf
        expect(doc.node.forms).toHaveLength(2);
        expect(doc.node.forms).toBeInstanceOf(HTMLCollection);
        expect(doc.node.forms.item(0)?.id).toBe('form-1');
        expect(doc.node.forms.item(1)?.id).toBe('form-2');
        expect(doc.node.forms.namedItem('form-1')?.id).toBe('form-1');
        expect(doc.node.forms.namedItem('alias-2')?.id).toBe('form-2');
    });

    it('embeds includes all <embed>', () => {
        doc.bodyElement.innerHTML = `<div><embed id="embed-1"></embed></div><embed id="embed-2" name="alias-2"></embed>`;
        // HTMLCollectionOf
        expect(doc.node.embeds).toHaveLength(2);
        expect(doc.node.embeds).toBeInstanceOf(HTMLCollection);
        expect(doc.node.embeds.item(0)?.id).toBe('embed-1');
        expect(doc.node.embeds.item(1)?.id).toBe('embed-2');
        expect(doc.node.embeds.namedItem('embed-1')?.id).toBe('embed-1');
        expect(doc.node.embeds.namedItem('alias-2')?.id).toBe('embed-2');
    });

    it('plugins is alias of embeds', () => {
        doc.bodyElement.innerHTML = `<div><embed id="embed-1"></embed></div><embed id="embed-2" name="alias-2"></embed>`;
        // HTMLCollectionOf
        expect(doc.node.plugins).toHaveLength(2);
        expect(doc.node.plugins).toBeInstanceOf(HTMLCollection);
        expect(doc.node.plugins.item(0)?.id).toBe('embed-1');
        expect(doc.node.plugins.item(1)?.id).toBe('embed-2');
        expect(doc.node.plugins.namedItem('embed-1')?.id).toBe('embed-1');
        expect(doc.node.plugins.namedItem('alias-2')?.id).toBe('embed-2');
    });

    it('images includes all <img>', () => {
        doc.bodyElement.innerHTML = `<div><img id="image-1" src=""/></div><img id="image-2" name="alias-2" src=""/>`;
        // HTMLCollectionOf
        expect(doc.node.images).toHaveLength(2);
        expect(doc.node.images).toBeInstanceOf(HTMLCollection);
        expect(doc.node.images.item(0)?.id).toBe('image-1');
        expect(doc.node.images.item(1)?.id).toBe('image-2');
        expect(doc.node.images.namedItem('image-1')?.id).toBe('image-1');
        expect(doc.node.images.namedItem('alias-2')?.id).toBe('image-2');
    });

    it('links includes all <a> and <area> with href attribute', () => {
        doc.bodyElement.innerHTML = `<div><a id="a-1" href></a><a id="a-1-1"></a></div><area id="area-2" href name="alias-2"></area><area id="area-2-1" name="alias-2"></area>`;
        // HTMLCollectionOf
        expect(doc.node.links).toHaveLength(2);
        expect(doc.node.links).toBeInstanceOf(HTMLCollection);
        expect(doc.node.links.item(0)?.id).toBe('a-1');
        expect(doc.node.links.item(1)?.id).toBe('area-2');
        expect(doc.node.links.namedItem('a-1')?.id).toBe('a-1');
        expect(doc.node.links.namedItem('alias-2')?.id).toBe('area-2');
    });

    it('scripts includes all <script> elements', () => {
        const script = doc.node.createElement('script');
        script.src = './foo.js';
        doc.headElement.appendChild(script);
        // HTMLCollectionOf
        expect(doc.node.scripts).toHaveLength(1);
        expect(doc.node.scripts).toBeInstanceOf(HTMLCollection);
        expect(doc.node.scripts.item(0)?.src).toContain('/foo.js');
    });

    it('children includes only htmlElement', () => {
        // HTMLCollection
        expect(doc.node.children).toHaveLength(1);
        expect(doc.node.children).toBeInstanceOf(HTMLCollection);
        expect(doc.node.children.item(0)).toStrictEqual(doc.htmlElement);
    });

    it('childNodes includes only htmlElement', () => {
        expect(doc.node.childNodes).toHaveLength(1);
        expect(doc.node.childNodes.item(0)).toStrictEqual(doc.htmlElement);
    });

    it('childElementCount is always 1', () => {
        expect(doc.node.childElementCount).toBe(1);
    });

    it('firstElementChild is htmlElement', () => {
        expect(doc.node.firstElementChild).toStrictEqual(doc.htmlElement);
    });

    it('lastElementChild is htmlElement', () => {
        expect(doc.node.lastElementChild).toStrictEqual(doc.htmlElement);
    });

    it('dir is got from htmlElement and can be set', () => {
        doc.htmlElement.dir = 'rtl';
        expect(doc.node.dir).toBe('rtl');

        doc.node.dir = 'ltr';

        expect(doc.htmlElement.dir).toBe('ltr');
    });

    it('hidden is false', () => {
        expect(doc.node.hidden).toBe(false);
    });

    it('visibilityState is visible', async () => {
        expect(doc.node.visibilityState).toBe('visible');
    });

    it('styleSheets refers to all avaliable <style> and <link>', async () => {
        doc.bodyElement.innerHTML = `<div><link rel="stylesheet" href="http://localhost:10810/chrome/BOM/Document/styleSheets.css" /><style type="text/css">i{}</style></div>`;
        // sheet works only after DOM connected.
        document.body.appendChild(doc.htmlElement);
        await delay(400);
        expect(doc.node.styleSheets).toHaveLength(2);
        // StyleSheetList
        expect(doc.node.styleSheets.item(0)).toBeInstanceOf(CSSStyleSheet);
    });

    describe('baseURI', () => {
        let doc: DocumentNode;
        const NEW_BASE = 'https://google.com/test/';
        beforeEach(() => {
            doc = new DocumentNode('test', window, {
                baseURI: NEW_BASE,
            });
        });
        it('created node has corrent baseURI', async () => {
            expect(doc.node.createElement('i').baseURI).toBe(NEW_BASE);
            expect(doc.node.createElementNS('http://www.w3.org/1999/xhtml', 'i').baseURI).toBe(NEW_BASE);
            expect(doc.node.createComment('x').baseURI).toBe(NEW_BASE);
            expect(doc.node.createDocumentFragment().baseURI).toBe(NEW_BASE);
            expect(doc.node.createTextNode('x').baseURI).toBe(NEW_BASE);
            expect(doc.node.createAttribute('name').baseURI).toBe(NEW_BASE);
            expect(doc.node.createAttributeNS('http://www.w3.org/1999/xhtml', 'name').baseURI).toBe(NEW_BASE);
        });

        it('src of <script> is relative to baseURI', () => {
            let script = doc.node.createElement('script');
            script.src = 'a.js';
            expect(script.src).toBe(`${NEW_BASE}a.js`);

            script = doc.node.createElement('script');
            script.src = '/a.js';
            expect(script.src).toBe(`https://google.com/a.js`);
        });
    });

    describe('dynamically created script', () => {
        it('load event is dispatched if script injected in head', async () => {
            const script = doc.node.createElement('script');
            script.src = 'https://localhost:10810/chrome/dynamic.js';
            const onload = jest.fn();
            script.onload = onload;
            script.addEventListener('load', onload);
            doc.headElement.appendChild(script);
            await delay(100);
            expect(onload).toHaveBeenCalledTimes(2);
        });

        it('error event is dispatched if script loaded failed', async () => {
            const script = doc.node.createElement('script');
            script.src = 'https://localhost:10810/chrome/dynamic.js';
            doc.hooks.scriptappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            script.onerror = onerror;
            script.addEventListener('error', onerror);
            doc.headElement.appendChild(script);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(2);
        });

        it('neither error or load event is dispatched if script has no src', async () => {
            const script = doc.node.createElement('script');
            script.text = ';';
            doc.hooks.scriptappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            const onload = jest.fn();
            script.onerror = onerror;
            script.onload = onload;
            doc.headElement.appendChild(script);
            await delay(100);
            expect(onerror).not.toHaveBeenCalled();
            expect(onload).not.toHaveBeenCalled();
        });

        it('error event is dispatched if script has empty-string src', async () => {
            const script = doc.node.createElement('script');
            script.src = '';
            script.text = ';';
            doc.hooks.scriptappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            script.onerror = onerror;
            doc.headElement.appendChild(script);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(1);
        });

        it('error event is dispatched if script has undefined src', async () => {
            const script = doc.node.createElement('script');
            // @ts-ignore test
            script.src = undefined;
            expect(script.src).toBe(`${doc.node.baseURI}undefined`);
            script.text = ';';
            doc.hooks.scriptappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            script.onerror = onerror;
            doc.headElement.appendChild(script);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(1);
        });

        it('error event is dispatched if script has null src', async () => {
            const script = doc.node.createElement('script');
            // @ts-ignore test
            script.src = null;
            script.text = ';';
            expect(script.src).toBe(`${doc.node.baseURI}null`);
            doc.hooks.scriptappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            script.onerror = onerror;
            doc.headElement.appendChild(script);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(1);
        });
    });

    describe('dynamically created link', () => {
        it('load event is dispatched if link injected in head', async () => {
            const link = doc.node.createElement('link');
            link.href = 'https://localhost:10810/chrome/dynamic.css';
            const onload = jest.fn();
            link.onload = onload;
            link.addEventListener('load', onload);
            doc.headElement.appendChild(link);
            await delay(100);
            expect(onload).toHaveBeenCalledTimes(2);
        });

        it('error event is dispatched if link loaded failed', async () => {
            const link = doc.node.createElement('link');
            link.href = 'https://localhost:10810/chrome/dynamic.css';
            doc.hooks.linkappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            link.onerror = onerror;
            link.addEventListener('error', onerror);
            doc.headElement.appendChild(link);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(2);
        });

        it('neither error or load event is dispatched if link has no href', async () => {
            const link = doc.node.createElement('link');
            doc.hooks.linkappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            const onload = jest.fn();
            link.onerror = onerror;
            link.onload = onload;
            doc.headElement.appendChild(link);
            await delay(100);
            expect(onerror).not.toHaveBeenCalled();
            expect(onload).not.toHaveBeenCalled();
        });

        it('error event is dispatched if link has empty-string href', async () => {
            const link = doc.node.createElement('link');
            link.href = '';
            doc.hooks.linkappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            link.onerror = onerror;
            doc.headElement.appendChild(link);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(1);
        });

        it('error event is dispatched if link has undefined href', async () => {
            const link = doc.node.createElement('link');
            // @ts-ignore test
            link.href = undefined;
            expect(link.href).toBe(`${doc.node.baseURI}undefined`);
            doc.hooks.linkappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            link.onerror = onerror;
            doc.headElement.appendChild(link);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(1);
        });

        it('error event is dispatched if link has null href', async () => {
            const link = doc.node.createElement('link');
            // @ts-ignore test
            link.href = null;
            expect(link.href).toBe(`${doc.node.baseURI}null`);
            doc.hooks.linkappended.tapPromise('test', async () => Promise.reject(Error('fake')));
            const onerror = jest.fn();
            link.onerror = onerror;
            doc.headElement.appendChild(link);
            await delay(100);
            expect(onerror).toHaveBeenCalledTimes(1);
        });
    });

    it('location refers to the global one', async () => {
        expect(Reflect.get(doc.node, 'location')).toStrictEqual<Location>(location);
        doc.node.location.hash = 'x';
        expect(location.hash).toStrictEqual<string>('#x');
    });

    describe('lastModified', () => {
        it('lastModified is dd/mm/YYYY HH:ii:ss format', async () => {
            expect(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(doc.node.lastModified)).toBe(true);
        });

        it('lastModified is Now if not specified', async () => {
            const doc = new DocumentNode('test', window, {});
            const previous = doc.node.lastModified;
            await delay(1500);
            expect(previous).not.toEqual(doc.node.lastModified);
        });
    });

    describe('autoDocumentEvents', () => {
        let doc: DocumentNode;
        beforeEach(() => {
            doc = new DocumentNode('test', win.node, {
                autoDocumentEvents: ['DOMContentLoaded', 'readystatechange'],
            });
        });

        it('fire DOMContentLoaded', () => {
            const events: Event[] = [];

            const fn = jest.fn((evt: Event) => {
                events.push(evt);
            });

            doc.node.addEventListener('DOMContentLoaded', fn);
            doc.onLoad();
            expect(fn).toHaveBeenCalled();

            expect(events).toHaveLength(1);
            expect(events[0].composed).toBe(false);
            expect(events[0].bubbles).toBe(true);
            expect(events[0].cancelable).toBe(false);
            expect(events[0].currentTarget).toBeNull();
            expect(events[0].target).toBe(doc.node);
            expect(events[0].srcElement).toBe(doc.node);
            expect(events[0].composedPath()).toHaveLength(1);
            expect(events[0].composedPath()[0]).toBe(doc.node);
        });

        it('fire readystatechange', () => {
            const events: Event[] = [];
            const readyStates: DocumentReadyState[] = [];

            const fn = jest.fn((evt: Event) => {
                events.push(evt);
                readyStates.push(doc.node.readyState);
            });

            const fn2 = jest.fn();

            doc.node.addEventListener('readystatechange', fn);
            doc.node.onreadystatechange = fn2;
            doc.onLoading();
            doc.onLoad();
            expect(fn).toHaveBeenCalled();
            expect(fn2).toHaveBeenCalled();

            expect(readyStates).toEqual(['interactive', 'complete']);

            expect(events).toHaveLength(2);
            expect(events[0].composed).toBe(false);
            expect(events[0].currentTarget).toBeNull();
            expect(events[0].target).toBe(doc.node);
            expect(events[0].bubbles).toBe(false);
            expect(events[0].cancelable).toBe(false);
            expect(events[0].srcElement).toBe(doc.node);
            expect(events[0].composedPath()).toHaveLength(1);
            expect(events[0].composedPath()[0]).toBe(doc.node);
        });
    });
});
