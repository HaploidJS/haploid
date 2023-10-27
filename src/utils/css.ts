import { toAbsolutePath } from './url';
import { populateSheetWhenCreateHTMLDocument } from './features';

const MATCH_CHARSET = /@charset\s+(['"])(.*?)\1\s*;?/g;
const MATCH_IMPORT = /@import\s+(['"])(.*?)\1;?/g;
const MATCH_URL = /\burl\(\s*(['"])?(.*?)\1\s*\)/g;
const MATCH_IMAGE_SET = /\bimage-set\(\s*(['"])(.*?)\1/;

function replaceUrl(css: string, sourceURL: string): string {
    return css.replace(MATCH_URL, ($0, $1, $2) => {
        $2 = $2.trim();
        if (!$2 || $2.startsWith('#')) {
            return $0;
        }

        const sep = $1 || '';
        const n = `url(${sep}${toAbsolutePath($2, sourceURL)}${sep})`;
        return n;
    });
}

export function fixCssUrl(css: string, sourceURL: string, dropStyleSheetWay?: boolean): string {
    css = css.replace(MATCH_CHARSET, '/* removed @charset */');

    const matched = css.match(MATCH_IMAGE_SET);
    if (matched) {
        console.warn(
            `A path string "${matched[2]}" for image-set() without url() surrounding is detected in ${sourceURL}, it's value cannot be corrected until you define it with url().`
        );
    }

    let sheet: CSSStyleSheet | false;

    if (!dropStyleSheetWay && (sheet = populateSheetWhenCreateHTMLDocument(css))) {
        const cssRules = Array.from(sheet.cssRules);
        return cssRules
            .map(rule => {
                if (rule instanceof CSSImportRule) {
                    // import rule
                    const mediaText = rule.media.mediaText ? ` ${rule.media.mediaText}` : '';
                    return `@import url("${toAbsolutePath(rule.href, sourceURL)}")${mediaText};`;
                }

                return replaceUrl(rule.cssText, sourceURL);
            })
            .join('');
    } else {
        return replaceUrl(
            css.replace(MATCH_IMPORT, function ($0, $1, $2) {
                $2 = $2.trim();
                return $2 ? `@import url(${$1}${$2}${$1});` : '/* removed @import */';
            }),
            sourceURL
        );
    }
}
