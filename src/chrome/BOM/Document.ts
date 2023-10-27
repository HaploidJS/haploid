import { createPseudoScriptElement, createPseudoLinkElement, HAPLOID_SCRIPT_TAG_NAME } from '../../utils/PseudoElement';
import { mergeByDescriptor } from '../../utils/mergeByDescriptor';
import type { DocumentShadow, DocumentOptions } from './interfaces';
import { AsyncSeriesBailHook } from '../../tapable/index';
import { EventNodeProxy } from './EventNodeProxy';
import { DOMContentLoadedEvent } from './Event';
import { nativeWindow } from '../utils';
import {
    createDocumentRootElement,
    createHTMLCollection,
    createHTMLAllCollection,
    createHTMLCollectionOf,
    createStyleSheetList,
    createNodeListOf,
    createFakeElement,
    createFakeDocumentFragment,
    createFakeComment,
    createFakeElementNS,
    createFakeAttribute,
    createFakeTextNode,
    createFakeAttributeNS,
} from './utils';

function formatLastModified(dat: Date): string {
    return `${(1 + dat.getMonth()).toString().padStart(2, '0')}/${dat
        .getDate()
        .toString()
        .padStart(2, '0')}/${dat.getFullYear()} ${dat.getHours().toString().padStart(2, '0')}:${dat
        .getMinutes()
        .toString()
        .padStart(2, '0')}:${dat.getSeconds().toString().padStart(2, '0')}`;
}

/**
 * Proxy Node of document object.
 */
export class DocumentNode extends EventNodeProxy<Document> implements DocumentShadow {
    readonly #root: ReturnType<typeof createDocumentRootElement>;
    readonly #window: Window;

    /** Observe DOM changed in head, link and script specially */
    readonly #resourceObserver: MutationObserver;

    public readonly hooks = Object.freeze({
        scriptappended: new AsyncSeriesBailHook<HTMLScriptElement, void>(['script']),
        linkappended: new AsyncSeriesBailHook<HTMLLinkElement, void>(['link']),
    });

    readonly #baseURI: string;

    #visibilityState: DocumentVisibilityState = 'visible';

    readonly #options: DocumentOptions;

    constructor(name: string, window: Window, documentOptions: DocumentOptions) {
        super(
            name,
            nativeWindow.document,
            {},
            {
                escapeEvents: documentOptions.escapeDocumentEvents,
            }
        );
        this.#window = window;
        this.#options = documentOptions;

        // Is this default value reasonable?
        this.#baseURI = documentOptions.baseURI || nativeWindow.location.href;

        this.#root = createDocumentRootElement(this.node, this.#options);
        // Add this attribute just for DOM readability.
        this.#root.html.setAttribute('data-sandbox', '');

        // Freeze this property.
        Reflect.defineProperty(this, 'hooks', {
            writable: false,
            configurable: false,
        });

        this.#resourceObserver = new MutationObserver(mutationsList => {
            for (const mut of mutationsList) {
                const { addedNodes } = mut;
                for (const node of addedNodes) {
                    if (this.#appendedScripts.includes(node) || this.#appendedLinks.includes(node)) {
                        this.debug('%O has been appended before.', node);
                        continue;
                    } else if (this.#createdScripts.includes(node)) {
                        this.debug('Found a created script injected to head, execute it.');
                        // Handle a dynamically created script.
                        this.#appendedScripts.push(node);
                        this.#executeScriptElement(node as HTMLScriptElement);
                    } else if (this.#createdLinks.includes(node)) {
                        this.debug('Found a created link injected to head, execute it.');
                        // Handle a dynamically created link.
                        this.#appendedLinks.push(node);
                        this.#executeLinkElement(node as HTMLLinkElement);
                    }
                }
            }
        });

        // Only observe head for performance.
        this.#resourceObserver.observe(this.headElement, {
            childList: true,
        });
    }

    public get htmlElement(): HTMLElement {
        return this.#root.html;
    }

    public get bodyElement(): HTMLElement {
        return this.#root.body;
    }

    public get headElement(): HTMLElement {
        return this.#root.head;
    }

    public get titleElement(): HTMLElement {
        return this.#root.title;
    }

    public toggleVisibilityState(visibilityState: DocumentVisibilityState): void {
        const oldState = this.#visibilityState;
        this.#visibilityState = visibilityState;

        if (oldState !== visibilityState) {
            // TODO visibilitychange should consider native, native visibilitychange doesn't mean real changed.
            document.dispatchEvent(
                new Event('visibilitychange', {
                    bubbles: true,
                })
            );
        }
    }

    #readyState: DocumentReadyState = 'loading';

    #changeReadyState(readyState: DocumentReadyState): void {
        if (readyState === this.#readyState) return;

        this.#readyState = readyState;

        if (this.#options.autoDocumentEvents?.includes('readystatechange')) {
            const readystatechangeEvent = new Event('readystatechange', { bubbles: false, cancelable: false });
            this.dispatchScopedEvent(readystatechangeEvent);
        }
    }

    protected override getBuiltInShadow(): Record<string, unknown> {
        const getRoot = (): HTMLHtmlElement => this.htmlElement as HTMLHtmlElement;
        const getWin = (): Window => this.#window;
        const getBaseURI = (): string => this.#baseURI;
        const getNode = (): Document => this.node;
        const getVisibilityState = (): DocumentVisibilityState => this.#visibilityState;
        const getHead = (): HTMLHeadElement => this.headElement as HTMLHeadElement;
        const getBody = (): HTMLBodyElement => this.bodyElement as HTMLBodyElement;
        const getTitle = (): HTMLTitleElement => this.titleElement as HTMLTitleElement;
        const getOptions = (): DocumentOptions => this.#options;
        const debug = this.debug;

        const getReadyState = (): DocumentReadyState => this.#readyState;

        return mergeByDescriptor(
            {
                /* open/close/write/writeln/replaceChildren are dangerous, must be forbidden. */

                open: (): Document => {
                    console.warn(`document.open is not allowed`);
                    return getNode();
                },
                close: (): void => {
                    console.warn(`document.close is not allowed`);
                },
                write: (): void => {
                    console.warn(`document.write is not allowed`);
                },
                writeln: (): void => {
                    console.warn(`document.writeln is not allowed`);
                },
                replaceChildren: (): void => {
                    console.warn(`document.replaceChildren is not allowed`);
                },

                /* getElement* and querySelector(All) must be scoped. */

                getElementById: (id: string): Element | null => getRoot().querySelector(`#${id}`),
                getElementsByClassName: (selector: string): HTMLCollectionOf<Element> =>
                    getRoot().getElementsByClassName(selector),
                getElementsByTagName: (selector: string): HTMLCollection => {
                    if ('string' !== typeof selector) {
                        return createHTMLCollection([]);
                    }

                    switch (selector.toLowerCase()) {
                        case 'title':
                            return createHTMLCollection([getTitle()]);
                        case 'head':
                            return createHTMLCollection([getHead()]);
                        case 'body':
                            return createHTMLCollection([getBody()]);
                        case 'html':
                            return createHTMLCollection([getRoot()]);
                    }

                    return getRoot().getElementsByTagName(selector);
                },
                querySelector: (selector: string): Element | null => {
                    if ('string' !== typeof selector) {
                        return null;
                    }

                    switch (selector.toLowerCase()) {
                        case 'title':
                            return getTitle();
                        case 'head':
                            return getHead();
                        case 'body':
                            return getBody();
                        case 'html':
                            return getRoot();
                    }
                    return getRoot().querySelector(selector);
                },
                querySelectorAll: (selector: string): NodeListOf<Element> => {
                    if ('string' !== typeof selector) {
                        return createNodeListOf<Element>([]);
                    }

                    switch (selector.toLowerCase()) {
                        case 'title':
                            return createNodeListOf<Element>([getTitle()]);
                        case 'head':
                            return createNodeListOf<Element>([getHead()]);
                        case 'body':
                            return createNodeListOf<Element>([getBody()]);
                        case 'html':
                            return createNodeListOf<Element>([getRoot()]);
                    }
                    return getRoot().querySelectorAll(selector);
                },
                getElementsByTagNameNS: (ns: string, selector: string): HTMLCollectionOf<Element> =>
                    getRoot().getElementsByTagNameNS(ns, selector),

                /* create* should consider ownerDocument and baseURI. */

                createElement: (tagName: string, options?: ElementCreationOptions): HTMLElement => {
                    debug('createElement(%s).', tagName);

                    if (tagName.toLowerCase() === 'script') {
                        return this.createPseudoScriptElement();
                    }

                    if (tagName.toLowerCase() === 'link') {
                        return this.createPseudoLinkElement();
                    }

                    const rawElement = createFakeElement([tagName, options], getNode());

                    return rawElement;
                },
                createElementNS: (
                    namespaceURI: string | null,
                    qualifiedName: string,
                    options?: ElementCreationOptions
                ): Element => {
                    if (qualifiedName.toLowerCase() === 'script') {
                        return this.createPseudoScriptElement();
                    }

                    if (qualifiedName.toLowerCase() === 'link') {
                        return this.createPseudoLinkElement();
                    }

                    const rawElement = createFakeElementNS([namespaceURI, qualifiedName, options], getNode());

                    return rawElement;
                },
                createComment: (data: string): Comment => {
                    const rawComment = createFakeComment([data], getNode());
                    return rawComment;
                },
                createDocumentFragment: (): DocumentFragment => {
                    const rawFragment = createFakeDocumentFragment([], getNode());
                    return rawFragment;
                },
                createAttribute: (localName: string): Attr => {
                    const rawAttribute = createFakeAttribute([localName], getNode());
                    return rawAttribute;
                },
                createAttributeNS: (namespace: string | null, qualifiedName: string): Attr => {
                    const rawAttribute = createFakeAttributeNS([namespace, qualifiedName], getNode());
                    return rawAttribute;
                },
                createTextNode: (data: string): Text => {
                    return createFakeTextNode([data], getNode());
                },

                /** document.defaultView should be the window proxy instead of window itself. */
                get defaultView(): Window {
                    return getWin();
                },
                /** document.documentElement refers to the <html>, but <haploid-html> here. */
                get documentElement(): HTMLHtmlElement {
                    return getRoot();
                },
                /* document.title should be content of the <title>, but <haploid-title> here. */
                get title(): string {
                    return getTitle().text;
                },
                set title(x: string) {
                    getTitle().text = x;
                },
                /** document.head refers to the <head>, but <haploid-head> here. */
                get head(): HTMLHeadElement {
                    return getHead();
                },
                /** document.body refers to the <body>, but <haploid-body> here. */
                get body(): HTMLBodyElement {
                    return getBody();
                },
                /**
                 * document.all contains all elements, but must be scoped here.
                 *
                 * 🔥 Notice that the real document.all has an [[IsHTMLDDA]] internal slot,
                 * it behaves like undefined:
                 *
                 * 1. typeof document.all === "undefined"
                 * 2. if (document.all) { // never enter
                 *
                 * We cannot implement it like that, this may be a breaking change.
                 *
                 * @todo add an option to disable this.
                 * @see https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot-typeof
                 */
                get all(): HTMLAllCollection {
                    const descendants = Array.from(getRoot().getElementsByTagName('*')) as Array<Element>;
                    return createHTMLAllCollection([getRoot(), ...descendants]);
                },

                /* forms/embeds/plugins/images should all be scoped. */

                get forms(): HTMLCollectionOf<HTMLFormElement> {
                    return getRoot().getElementsByTagName('form');
                },
                get embeds(): HTMLCollectionOf<HTMLEmbedElement> {
                    return getRoot().getElementsByTagName('embed');
                },
                get plugins(): HTMLCollectionOf<HTMLEmbedElement> {
                    return getRoot().getElementsByTagName('embed');
                },
                get images(): HTMLCollectionOf<HTMLImageElement> {
                    return getRoot().getElementsByTagName('img');
                },
                /** document.links refers to all <area> and <a> with href attribute. */
                get links(): HTMLCollectionOf<HTMLAnchorElement | HTMLAreaElement> {
                    return createHTMLCollectionOf(getRoot().querySelectorAll('area[href],a[href]'));
                },
                /** document.scripts refers to all <haploid-script> instead of <script>. */
                get scripts(): HTMLCollectionOf<HTMLScriptElement> {
                    return createHTMLCollectionOf(getRoot().querySelectorAll(HAPLOID_SCRIPT_TAG_NAME));
                },
                /** document.children only contains <html>, but <haploid-html> here. */
                get children(): HTMLCollection {
                    return createHTMLCollection([getRoot()]);
                },
                /**
                 * document.childNodes should contain <DOCTYPE> and <html>, but we have no <DOCTYPE>.
                 * It may be a breaking change.
                 *
                 * @todo add an option to disable this.
                 */
                get childNodes(): NodeListOf<ChildNode> {
                    return createNodeListOf([getRoot()]);
                },
                /** document.childElementCount is always 1. */
                get childElementCount(): number {
                    return 1;
                },
                /** document.firstElementChild is always <html>, but <haploid-html> here. */
                get firstElementChild(): Element {
                    return getRoot();
                },
                /** Same as document.firstElementChild. */
                get lastElementChild(): Element {
                    return getRoot();
                },
                /** Value of dir attribute of <haploid-html>. */
                get dir(): string {
                    return getRoot().dir;
                },
                set dir(dir: string) {
                    getRoot().dir = dir;
                },
                get hidden(): boolean {
                    return getNode().visibilityState === 'hidden';
                },
                get visibilityState(): DocumentVisibilityState {
                    switch (nativeWindow.document.visibilityState) {
                        case 'hidden':
                            return 'hidden';
                        default:
                    }
                    return getVisibilityState();
                },
                /**
                 * document.styleSheets refers to all <style> and <link> with rel attribute equals stylesheet.
                 *
                 * @todo add <haploid-link>
                 */
                get styleSheets(): StyleSheetList {
                    const list: CSSStyleSheet[] = [];

                    const styles = getRoot().querySelectorAll<HTMLStyleElement | HTMLLinkElement>(
                        'style,link[rel=stylesheet]'
                    );

                    for (const ele of styles) {
                        if (ele.sheet) {
                            list.push(ele.sheet);
                        }
                    }

                    return createStyleSheetList(list);
                },
                get baseURI(): string {
                    return getBaseURI();
                },
                /** Native location can only be visited from real document. */
                get location(): Location {
                    return nativeWindow.document.location;
                },
                set location(x: Location) {
                    nativeWindow.document.location = x;
                },
                /** Native cookie can only be visited from real document. */
                get cookie(): string {
                    return nativeWindow.document.cookie;
                },
                set cookie(cstr: string) {
                    nativeWindow.document.cookie = cstr;
                },
                get readyState(): DocumentReadyState {
                    return getReadyState();
                },
                get lastModified(): string {
                    const { lastModified } = getOptions();
                    if (!lastModified) return formatLastModified(new Date());
                    const lm = Date.parse(lastModified);
                    return lm ? formatLastModified(new Date(lm)) : formatLastModified(new Date(lm));
                },
            },
            super.getBuiltInShadow()
        );
    }

    #appendedScripts: Node[] = [];
    #createdScripts: Node[] = [];

    #appendedLinks: Node[] = [];
    #createdLinks: Node[] = [];

    public createPseudoScriptElement(): HTMLScriptElement {
        const getNode = (): Document => this.node;
        const getBaseURI = (): string => this.node.baseURI;

        const script = createPseudoScriptElement({
            baseURI: {
                get() {
                    return getBaseURI();
                },
                enumerable: true,
                configurable: true,
            },
            ownerDocument: {
                get() {
                    return getNode();
                },
                enumerable: true,
                configurable: true,
            },
        });

        this.#createdScripts.push(script);

        return script;
    }

    public createPseudoLinkElement(): HTMLLinkElement {
        const getNode = (): Document => this.node;
        const getBaseURI = (): string => this.node.baseURI;

        const link = createPseudoLinkElement({
            baseURI: {
                get() {
                    return getBaseURI();
                },
                enumerable: true,
                configurable: true,
            },
            ownerDocument: {
                get() {
                    return getNode();
                },
                enumerable: true,
                configurable: true,
            },
        });

        this.#createdLinks.push(link);

        return link;
    }

    #executeScriptElement(script: HTMLScriptElement): void {
        // <script> without src attribute does not fire error or load.
        if (!script.hasAttribute('src')) {
            return;
        }

        Promise.resolve(this.hooks.scriptappended.promise(script)).then(
            () => {
                script.dispatchEvent(
                    new Event('load', {
                        bubbles: false,
                        cancelable: false,
                        composed: false,
                    })
                );
            },
            () => {
                script.dispatchEvent(
                    new Event('error', {
                        bubbles: false,
                        cancelable: false,
                        composed: false,
                    })
                );
            }
        );
    }

    #executeLinkElement(link: HTMLLinkElement): void {
        // <link> without href attribute does not fire error or load.
        if (!link.hasAttribute('href')) {
            return;
        }

        Promise.resolve(this.hooks.linkappended.promise(link)).then(
            () => {
                link.dispatchEvent(
                    new Event('load', {
                        bubbles: false,
                        cancelable: false,
                        composed: false,
                    })
                );
            },
            () => {
                link.dispatchEvent(
                    new Event('error', {
                        bubbles: false,
                        cancelable: false,
                        composed: false,
                    })
                );
            }
        );
    }

    protected override get debugName(): string {
        return `chrome:Document:${this.name}`;
    }

    public override onLoading(): void {
        this.#changeReadyState('interactive');
    }

    public override onLoad(): void {
        if (this.#options.autoDocumentEvents?.includes('DOMContentLoaded')) {
            this.dispatchScopedEvent(new DOMContentLoadedEvent());
        }

        this.#changeReadyState('complete');

        super.onLoad();
    }

    public override onDestroy(): void {
        this.#resourceObserver.disconnect();
        super.onDestroy();
    }
}
