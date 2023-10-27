export function getAvaliableCustomElementName(prefix: string): string {
    // Search for avaliable custom element name.
    let gindex = -1;
    let tagName: string;
    do {
        gindex += 1;
        tagName = `${prefix}${gindex ? gindex : ''}`;
    } while (window.customElements.get(tagName));

    return tagName;
}
