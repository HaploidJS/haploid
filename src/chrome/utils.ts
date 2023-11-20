import { ElementNode, ScriptNode, StyleNode } from '../node/';
import { baseDebugger } from '../utils/Debugger';
import { ResourceFetchingOptions } from '@/Def';

const debug = baseDebugger.extend('chrome:utils');

export const nativeWindow: Window & typeof globalThis = (0, eval)('window;');

export function summary(str: string, len = 50): string {
    const chars = Array.from(str);
    return chars.length > 50 ? `${chars.slice(0, len).join('')}...` : str;
}

export type ChromeContent = {
    scripts: ScriptNode[];
    styles: StyleNode[];
};

export function analyse(content: ChromeContent): {
    styles: StyleNode[];
    depScripts: ScriptNode[];
    nonDepScripts: ScriptNode[];
    entry: ScriptNode | null;
} {
    const invalid: ElementNode[] = [];
    const scripts: ScriptNode[] = [];
    const styles: StyleNode[] = [];
    const entries: ScriptNode[] = [];

    content.scripts.forEach(node => {
        (node.isValid ? scripts : invalid).push(node);
        if (node.isValid && node.isEntry) entries.push(node);
    });

    if (entries.length > 1) {
        debug('Unexpected redundant entries:\n%s.', entries.join('\n'));
        throw Error(`Unexpected redundant entries.`);
    }

    let entry: ScriptNode | null = entries[0] ?? null;

    if (!entry) {
        for (let i = scripts.length - 1; i >= 0; i -= 1) {
            if ('undefined' === typeof scripts[i].isEntry) {
                entry = scripts[i];
                break;
            }
        }
    }

    content.styles.forEach(node => (node.isValid ? styles : invalid).push(node));

    if (debug.enabled && invalid.length > 0) {
        debug('Invalid style or script:\n%s.', invalid.join('\n'));
    }

    let entryIndex = -1;
    const depScripts: ScriptNode[] = [];
    const nonDepScripts: ScriptNode[] = [];

    scripts.forEach((s, index) => {
        if (s === entry) {
            entryIndex = index;
            return;
        }

        let isDep = false;

        if (entry?.isAsync) {
            isDep = entryIndex === -1 && !s.isAsync && !s.isDefer;
        } else if (entry?.isDefer) {
            isDep = (entryIndex === -1 && !s.isAsync) || (entryIndex > -1 && !s.isAsync && !s.isDefer);
        } else {
            isDep = entryIndex === -1 && !s.isAsync && !s.isDefer;
        }

        (isDep ? depScripts : nonDepScripts).push(s);
    });

    if (debug.enabled) {
        debug('Styles and dependency scripts:\n%s.', [...styles, ...depScripts, entry].join('\n'));
    }

    return {
        styles,
        depScripts,
        nonDepScripts,
        entry,
    };
}

export function urlRewrite(content: ChromeContent, rewriteFn?: (url: string) => string): ChromeContent {
    if (!rewriteFn) {
        return content;
    }

    if ('function' !== typeof rewriteFn) {
        console.warn('Option "rewriteFn" must be a function.');
        return content;
    }

    const rewritedScripts: ScriptNode[] = [];
    const rewritedStyles: StyleNode[] = [];

    for (const script of content.scripts) {
        if (script.src) {
            const newUrl = rewriteFn.call(null, script.src);
            if ('string' !== typeof newUrl) {
                console.warn(`Option "rewriteFn" must return a string`);
                rewritedScripts.push(script);
                continue;
            }

            debug('Rewrite %s to %s.', script.src, newUrl);

            rewritedScripts.push(
                script.clone({
                    src: newUrl,
                })
            );
        } else {
            rewritedScripts.push(script);
        }
    }

    for (const style of content.styles) {
        if (style.href) {
            const newUrl = rewriteFn.call(null, style.href);
            if ('string' !== typeof newUrl) {
                console.warn(`Option "rewriteFn" must return a string`);
                rewritedStyles.push(style);
                continue;
            }

            debug('Rewrite %s to %s.', style.href, newUrl);

            rewritedStyles.push(
                style.clone({
                    href: newUrl,
                })
            );
        } else {
            rewritedStyles.push(style);
        }
    }

    return {
        scripts: rewritedScripts,
        styles: rewritedStyles,
    };
}

export function createFetchResourceOptions(
    src?: string,
    resourceOptions?: ResourceFetchingOptions | ((src: string) => ResourceFetchingOptions)
): ResourceFetchingOptions {
    const fetchResourceOptions = resourceOptions;
    let rfo: ResourceFetchingOptions;

    if ('function' === typeof fetchResourceOptions) {
        rfo = src ? fetchResourceOptions.call(null, src) : {};
    } else {
        rfo = fetchResourceOptions ?? {};
    }

    if (!('timeout' in rfo)) {
        rfo.timeout = 5000;
    } else if ('number' !== typeof rfo.timeout || rfo.timeout < 0) {
        rfo.timeout = 5000;
    }

    if (!('retries' in rfo)) {
        rfo.retries = 0;
    } else if ('number' !== typeof rfo.retries || rfo.retries < 0) {
        rfo.retries = 0;
    }

    return rfo;
}
