let populateSheetWhenCreateHTMLDocumentIsNotSupported = false;

// https://github.com/jsdom/jsdom/issues/3179
export function populateSheetWhenCreateHTMLDocument(css: string): CSSStyleSheet | false {
    if (populateSheetWhenCreateHTMLDocumentIsNotSupported) {
        return false;
    }

    const doc = document.implementation.createHTMLDocument();
    const style = doc.createElement('style');
    style.textContent = css;
    doc.head.appendChild(style);

    /* istanbul ignore if: jsdom doesn't support */
    if (style.sheet) {
        return style.sheet;
    }

    populateSheetWhenCreateHTMLDocumentIsNotSupported = true;
    return false;
}
