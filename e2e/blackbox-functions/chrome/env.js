// This file is executed in sandbox.

function bindEvents() {
    document.querySelector('#document-write').addEventListener('click', () => {
        document.write('');
    });

    document.querySelector('#document-writeln').addEventListener('click', () => {
        document.writeln('');
    });

    document.querySelector('#document-open-close').addEventListener('click', () => {
        document.open();
        document.close();
    });

    document.querySelector('#document-replace-children').addEventListener('click', () => {
        document.replaceChildren();
    });

    document.querySelector('#visit-escape').addEventListener('click', e => {
        window.__GLOBAL_ESCAPE_VAR__ = true;
        e.target.innerText = String(window.__GLOBAL_ESCAPE_VAR__);
    });

    document.querySelector('#get-element-by-id').addEventListener('click', e => {
        const fix = document.getElementById('fixture-id');
        e.target.innerText = String(fix.hasAttribute('scoped'));
    });

    document.querySelector('#get-element-by-class-name').addEventListener('click', e => {
        const fix = document.getElementsByClassName('fixture-class');
        e.target.innerText = `${fix.length}/${fix[0].hasAttribute('scoped')}`;
    });

    document.querySelector('#get-element-by-tag-name').addEventListener('click', e => {
        const fix = document.getElementsByTagName('legend');
        e.target.innerText = `${fix.length}/${fix[0].hasAttribute('scoped')}`;
    });

    document.querySelector('#get-element-by-tag-name-ns').addEventListener('click', e => {
        const fix = document.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'legend');
        e.target.innerText = `${fix.length}/${fix[0].hasAttribute('scoped')}`;
    });

    document.querySelector('#query-selector').addEventListener('click', e => {
        const fix = document.querySelector('#fixture-id');
        e.target.innerText = String(fix.hasAttribute('scoped'));
    });

    document.querySelector('#query-selector-all').addEventListener('click', e => {
        const fix = document.querySelectorAll('.fixture-class');
        e.target.innerText = `${fix.length}/${fix[0].hasAttribute('scoped')}`;
    });

    document.querySelector('#create-element').addEventListener('click', e => {
        const ele = document.createElement('div');
        e.target.innerText = String(ele.ownerDocument === document);
    });

    document.querySelector('#create-element-ns').addEventListener('click', e => {
        const ele = document.createElementNS('http://www.w3.org/1999/xhtml', 'div');
        e.target.innerText = String(ele.ownerDocument === document && ele.baseURI === document.baseURI);
    });

    document.querySelector('#create-comment').addEventListener('click', e => {
        const ele = document.createComment('');
        e.target.innerText = String(ele.ownerDocument === document && ele.baseURI === document.baseURI);
    });

    document.querySelector('#create-document-fragment').addEventListener('click', e => {
        const ele = document.createDocumentFragment();
        e.target.innerText = String(ele.ownerDocument === document && ele.baseURI === document.baseURI);
    });

    document.querySelector('#create-attribute').addEventListener('click', e => {
        const ele = document.createAttribute('class');
        e.target.innerText = String(ele.ownerDocument === document && ele.baseURI === document.baseURI);
    });

    document.querySelector('#create-attribute-ns').addEventListener('click', e => {
        const ele = document.createAttributeNS('http://www.w3.org/1999/xhtml', 'class');
        e.target.innerText = String(ele.ownerDocument === document && ele.baseURI === document.baseURI);
    });

    document.querySelector('#create-text-node').addEventListener('click', e => {
        const ele = document.createTextNode('');
        e.target.innerText = String(ele.ownerDocument === document && ele.baseURI === document.baseURI);
    });

    document.querySelector('#document-dir').addEventListener('click', e => {
        document.dir = 'rtl';
        e.target.innerText = String(document.dir === 'rtl');
    });

    document.querySelector('#document-hidden').addEventListener('click', e => {
        e.target.innerText = String(document.hidden);
    });

    document.querySelector('#document-visibility-state').addEventListener('click', e => {
        e.target.innerText = String(document.visibilityState === 'visible');
    });

    document.querySelector('#document-defaultView').addEventListener('click', e => {
        e.target.innerText = String(document.defaultView === window);
    });

    document.querySelector('#document-documentElement').addEventListener('click', e => {
        e.target.innerText = String(document.documentElement.tagName === 'HTML');
    });

    document.querySelector('#document-title').addEventListener('click', e => {
        var result = document.title === '';
        document.title = 'foo';
        result = result && document.title === 'foo' && document.head.firstElementChild.textContent === 'foo';
        document.head.firstElementChild.textContent = 'bar';
        result = result && document.title === 'bar';
        e.target.innerText = String(result);
    });

    document.querySelector('#document-head').addEventListener('click', e => {
        e.target.innerText = String(
            document.head.tagName === 'HEAD' &&
                document.head.nodeName === 'HEAD' &&
                document.head.constructor === HTMLHeadElement &&
                document.head instanceof HTMLHeadElement &&
                document.head.ownerDocument === document
        );
    });

    document.querySelector('#document-body').addEventListener('click', e => {
        e.target.innerText = String(
            document.body.tagName === 'BODY' &&
                document.body.nodeName === 'BODY' &&
                document.body.constructor === HTMLBodyElement &&
                document.body instanceof HTMLBodyElement &&
                document.body.ownerDocument === document
        );
    });

    document.querySelector('#document-all').addEventListener('click', e => {
        e.target.innerText = String(document.all instanceof HTMLAllCollection);
    });

    document.querySelector('#document-forms').addEventListener('click', e => {
        e.target.innerText = String(document.forms instanceof HTMLCollection);
    });

    document.querySelector('#document-embeds').addEventListener('click', e => {
        e.target.innerText = String(document.embeds instanceof HTMLCollection);
    });

    document.querySelector('#document-plugins').addEventListener('click', e => {
        e.target.innerText = String(document.plugins instanceof HTMLCollection);
    });

    document.querySelector('#document-images').addEventListener('click', e => {
        e.target.innerText = String(document.images instanceof HTMLCollection);
    });

    document.querySelector('#document-links').addEventListener('click', e => {
        e.target.innerText = String(document.links instanceof HTMLCollection);
    });

    document.querySelector('#document-scripts').addEventListener('click', e => {
        e.target.innerText = String(document.scripts instanceof HTMLCollection);
    });

    document.querySelector('#document-children').addEventListener('click', e => {
        e.target.innerText = String(
            document.children.length === 1 && document.children[0] === document.documentElement
        );
    });

    document.querySelector('#document-childNodes').addEventListener('click', e => {
        e.target.innerText = String(
            document.childNodes.length === 1 && document.childNodes[0] === document.documentElement
        );
    });

    document.querySelector('#document-childElementCount').addEventListener('click', e => {
        e.target.innerText = String(document.childElementCount === 1);
    });

    document.querySelector('#document-firstElementChild').addEventListener('click', e => {
        e.target.innerText = String(document.firstElementChild === document.documentElement);
    });

    document.querySelector('#document-lastElementChild').addEventListener('click', e => {
        e.target.innerText = String(document.lastElementChild === document.documentElement);
    });

    document.querySelector('#document-baseURI').addEventListener('click', e => {
        e.target.innerText = String(document.baseURI === location.href);
    });
}

function bootstrap({ domElement }) {
    window.__NEW_VALUE__ = true;
    Reflect.defineProperty(window, '__NEW_GETTER__', {
        get() {
            return true;
        },
        configurable: true,
    });

    Reflect.deleteProperty(window, '__GLOBAL_VAR__');

    const tpl = document.createElement('template');
    tpl.innerHTML = `
<div style="display:none">
    <div class="child"></div>
    <form class="child"></form>
    <embed class="child"></embed>
    <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII" class="child">
    <a href="" class="child"></a>
    <area shape="" coords="" href="" alt="" class="child">
</div>
   `;

    const operations = document.createElement('template');
    operations.innerHTML = `
   <button type="button" id="document-write">document-write</button>
   <button type="button" id="document-writeln">document-writeln</button>
   <button type="button" id="document-open-close">document-open-close</button>
   <button type="button" id="document-replace-children">document-replace-children</button>

   <button type="button" id="visit-escape">visit-escape</button>

   <button type="button" id="get-element-by-id">get-element-by-id</button>
   <button type="button" id="get-element-by-class-name">get-element-by-class-name</button>
   <button type="button" id="get-element-by-tag-name">get-element-by-tag-name</button>
   <button type="button" id="get-element-by-tag-name-ns">get-element-by-tag-name-ns</button>
   <button type="button" id="query-selector">query-selector</button>
   <button type="button" id="query-selector-all">query-selector-all</button>

   <button type="button" id="create-element">create-element</button>
   <button type="button" id="create-element-ns">create-element-ns</button>
   <button type="button" id="create-comment">create-comment</button>
   <button type="button" id="create-document-fragment">create-document-fragment</button>
   <button type="button" id="create-attribute">create-attribute</button>
   <button type="button" id="create-attribute-ns">create-attribute-ns</button>
   <button type="button" id="create-text-node">create-text-node</button>

   <button type="button" id="document-defaultView">document-defaultView</button>
   <button type="button" id="document-documentElement">document-documentElement</button>
   <button type="button" id="document-title">document-title</button>
   <button type="button" id="document-head">document-head</button>
   <button type="button" id="document-body">document-body</button>
   <button type="button" id="document-all">document-all</button>
   <button type="button" id="document-forms">document-forms</button>
   <button type="button" id="document-embeds">document-embeds</button>
   <button type="button" id="document-plugins">document-plugins</button>
   <button type="button" id="document-images">document-images</button>
   <button type="button" id="document-links">document-links</button>
   <button type="button" id="document-scripts">document-scripts</button>
   <button type="button" id="document-children">document-children</button>
   <button type="button" id="document-childNodes">document-childNodes</button>
   <button type="button" id="document-childElementCount">document-childElementCount</button>
   <button type="button" id="document-firstElementChild">document-firstElementChild</button>
   <button type="button" id="document-lastElementChild">document-lastElementChild</button>
   <button type="button" id="document-baseURI">document-baseURI</button>

   <button type="button" id="document-dir">document-dir</button>
   <button type="button" id="document-hidden">document-hidden</button>
   <button type="button" id="document-visibility-state">document-visibility-state</button>
  `;

    const fixtures = document.createElement('template');
    fixtures.innerHTML = `
    <div class="fixtures" style="display: none">
        <div id="fixture-id" scoped></div>
        <div class="fixture-class" scoped></div>
        <legend scoped></legend>
    </div>
  `;

    const style = document.createElement('style');
    style.textContent = `.assert .question::after{content:":";}`;

    domElement.parentElement.insertBefore(style, domElement);
    domElement.parentElement.insertBefore(operations.content, domElement);
    domElement.parentElement.insertBefore(tpl.content, domElement);
    domElement.parentElement.insertBefore(fixtures.content, domElement);
}

function mount({ domElement }) {
    domElement.innerHTML = `
    <div class="assert">
        <span class="question">__ENV_VAR__ === true</span>
        <span class="answer">${__ENV_VAR__ === true}</span>
    </div>
    <!-- window -->
    <div class="assert">
        <span class="question">window.__ENV_VAR__ === true</span>
        <span class="answer">${window.__ENV_VAR__ === true}</span>
    </div>
    <div class="assert">
        <span class="question">window.__NEW_VALUE__ === true</span>
        <span class="answer">${window.__NEW_VALUE__ === true}</span>
    </div>
    <div class="assert">
        <span class="question">window.__NEW_GETTER__ === true</span>
        <span class="answer">${window.__NEW_GETTER__ === true}</span>
    </div>
    <div class="assert">
        <span class="question">window.__GLOBAL_VAR__ === undefined</span>
        <span class="answer">${window.__GLOBAL_VAR__ === undefined}</span>
    </div>
    <div class="assert">
        <span class="question">window instanceof Window</span>
        <span class="answer">${window instanceof Window}</span>
    </div>
    <div class="assert">
        <span class="question">window.document === document</span>
        <span class="answer">${window.document === document}</span>
    </div>
    <div class="assert">
        <span class="question">window.window === window</span>
        <span class="answer">${window.window === window}</span>
    </div>
    <div class="assert">
        <span class="question">window.self === window</span>
        <span class="answer">${window.self === window}</span>
    </div>
    <div class="assert">
        <span class="question">self === window</span>
        <span class="answer">${self === window}</span>
    </div>
    <div class="assert">
        <span class="question">window.top === top</span>
        <span class="answer">${window.top === top}</span>
    </div>
    <div class="assert">
        <span class="question">window.parent === parent</span>
        <span class="answer">${window.parent === parent}</span>
    </div>
    <div class="assert">
        <span class="question">globalThis === window</span>
        <span class="answer">${globalThis === window}</span>
    </div>
    <div class="assert">
        <span class="question">window.globalThis === window</span>
        <span class="answer">${window.globalThis === window}</span>
    </div>
    <!-- document -->
    <div class="assert">
        <span class="question">document instanceof Document</span>
        <span class="answer">${document instanceof Document}</span>
    </div>
    <div class="assert">
        <span class="question">document.defaultView === window</span>
        <span class="answer">${document.defaultView === window}</span>
    </div>
    <div class="assert">
        <span class="question">document.documentElement is .haploid-html</span>
        <span class="answer">${document.documentElement.classList.contains('haploid-html')}</span>
    </div>
    <div class="assert">
        <span class="question">document.head is .haploid-head and firstChild of documentElement</span>
        <span class="answer">${
            document.head.classList.contains('haploid-head') &&
            document.head === document.documentElement.firstElementChild
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.body is .haploid-body and lastChild of documentElement</span>
        <span class="answer">${
            document.body.classList.contains('haploid-body') &&
            document.body === document.documentElement.lastElementChild
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.all instanceof HTMLAllCollection and doesn't include .interference</span>
        <span class="answer">${
            document.all instanceof HTMLAllCollection &&
            document.all.length > 0 &&
            !Array.from(document.all).find(el => el.classList.contains('interference'))
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.forms instanceof HTMLCollection and doesn't include .interference</span>
        <span class="answer">${
            document.forms instanceof HTMLCollection &&
            document.forms.length === 1 &&
            !Array.from(document.forms).find(el => el.classList.contains('interference'))
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.embeds instanceof HTMLCollection and doesn't include .interference</span>
        <span class="answer">${
            document.embeds instanceof HTMLCollection &&
            document.embeds.length === 1 &&
            !Array.from(document.embeds).find(el => el.classList.contains('interference'))
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.plugins instanceof HTMLCollection and doesn't include .interference</span>
        <span class="answer">${
            document.plugins instanceof HTMLCollection &&
            document.plugins.length === 1 &&
            !Array.from(document.plugins).find(el => el.classList.contains('interference'))
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.images instanceof HTMLCollection and doesn't include .interference</span>
        <span class="answer">${
            document.images instanceof HTMLCollection &&
            document.images.length === 1 &&
            !Array.from(document.images).find(el => el.classList.contains('interference'))
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.styleSheets instanceof StyleSheetList and doesn't include .interference</span>
        <span class="answer">${
            document.styleSheets instanceof StyleSheetList &&
            document.styleSheets.length === 1 &&
            !Array.from(document.styleSheets).find(el => el.ownerNode.classList.contains('interference'))
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.links instanceof HTMLCollection and doesn't include .interference</span>
        <span class="answer">${
            document.links instanceof HTMLCollection &&
            document.links.length === 2 &&
            !Array.from(document.links).find(el => el.classList.contains('interference'))
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.children instanceof HTMLCollection and only contain documentElement</span>
        <span class="answer">${
            document.children instanceof HTMLCollection &&
            document.children.length === 1 &&
            document.children[0] === document.documentElement
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.childNodes instanceof NodeList and only contain documentElement</span>
        <span class="answer">${
            document.childNodes instanceof NodeList &&
            document.childNodes.length === 1 &&
            document.childNodes[0] === document.documentElement
        }</span>
    </div>
    <div class="assert">
        <span class="question">document.childElementCount === 1</span>
        <span class="answer">${document.childElementCount === 1}</span>
    </div>
    <div class="assert">
        <span class="question">document.firstElementChild === document.documentElement</span>
        <span class="answer">${document.firstElementChild === document.documentElement}</span>
    </div>
    `;

    bindEvents();
}
function unmount({ domElement }) {
    domElement.innerHTML = '';
}

module.exports = { bootstrap, mount, unmount };
