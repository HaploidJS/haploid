import { filterDOM } from './filterDOM';
import { toAbsolutePath } from './url';

export class PresetDOMParser {
    public static parseHeadElement(domWrapper: string): DocumentFragment {
        const templateEle = document.createElement('template');
        templateEle.innerHTML = domWrapper || '';

        filterDOM(templateEle, (node: Node) => {
            // Remove illegal elements.
            if (/(script|link|body|html|head|title|base)/i.test(node.nodeName)) {
                return true;
            }

            if (node.nodeName === 'META') {
                const meta = node as HTMLMetaElement;
                return (
                    /^(refresh|(X-)?Frame-Options|(X-)?Content-Security-Policy)$/i.test(meta.httpEquiv) ||
                    /^(viewport)$/i.test(meta.name)
                );
            }

            return false;
        });

        return templateEle.content;
    }

    public static parseBodyElement(domWrapper: string, baseURL?: string): DocumentFragment {
        const templateEle = document.createElement('template');
        templateEle.innerHTML = domWrapper || `<div></div>`;

        filterDOM(templateEle, (node: Node) => {
            // Remove illegal elements.
            if (/(script|body|html|head|title|base|meta)/i.test(node.nodeName)) {
                return true;
            }

            // Only walk the children of element node.
            if (node.nodeType !== Node.ELEMENT_NODE) return false;

            const element = node as Element;

            const attrLen = element.attributes.length;

            for (let i = attrLen - 1; i > -1; i -= 1) {
                const attr = element.attributes[i];
                // Remove illegal attributes.
                if (/(^contenteditable$|^on[a-z])/i.test(attr.name)) {
                    console.warn(`Attribute ${attr.name} is not supported in domWrapper.`);
                    element.removeAttributeNode(attr);
                } else if (
                    (attr.name === 'src' && element.tagName === 'IMG') ||
                    (attr.name === 'data' && element.tagName === 'OBJECT') ||
                    (attr.name === 'src' && element.tagName === 'SOURCE') ||
                    (attr.name === 'src' && element.tagName === 'TRACK') ||
                    (attr.name === 'href' && element.tagName === 'A') ||
                    (attr.name === 'href' && element.tagName === 'AREA') ||
                    (attr.name === 'src' && element.tagName === 'AUDIO') ||
                    (attr.name === 'src' && element.tagName === 'VIDEO') ||
                    (attr.name === 'poster' && element.tagName === 'VIDEO') ||
                    (attr.name === 'cite' && element.tagName === 'BLOCKQUOTE') ||
                    (attr.name === 'cite' && element.tagName === 'Q') ||
                    (attr.name === 'action' && element.tagName === 'FORM') ||
                    (attr.name === 'src' && element.tagName === 'FRAME') ||
                    (attr.name === 'src' && element.tagName === 'IFRAME')
                ) {
                    // TODO support srcset in source/img elements
                    // Fix relative URLs.
                    const absoluteSrc = toAbsolutePath(attr.value, baseURL);
                    if (absoluteSrc) attr.value = absoluteSrc;
                }
            }

            return false;
        });

        // Default is <div>
        if (templateEle.content.childElementCount === 0) {
            templateEle.innerHTML = '<div><div/>';
        }

        const className = 'haploid-app-root';

        const root = templateEle.content.firstElementChild;

        // Add class "haploid-app-root" to first element.
        if (root && !root.classList.contains(className)) {
            root.classList.add(className);
        }

        return templateEle.content;
    }
}
