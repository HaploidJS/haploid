import { AssetsMap, fillAssetsMap, FullAssetsMap, AssetsModule } from '../AssetsMap';
import type { AppEntry } from '../Def';
import { baseDebugger as debug } from './Debugger';
import { ScriptNode, StyleNode } from '../node/';

import { fetchWithTimeoutAndRetry } from '../utils/fetchWithTimeoutAndRetry';
import { parseUri } from '../utils/navigateToUrl';
import { toAbsolutePath } from '../utils/url';

type Versionable<T, V> = T & { version: V };

const FETCH_ENTRY_TIMEOUT = 5000;

export async function resolveAssetsFromEntry(entry: AppEntry): Promise<{
    scripts: ScriptNode[];
    styles: StyleNode[];
    isHTML?: boolean;
    isJSON?: boolean;
    isJS?: boolean;
    headHTML?: string;
    bodyHTML?: string;
    title?: string;
    lastModified?: string;
}> {
    debug('Call resolveAssetsFromEntry(%O).', entry);

    entry.url = entry.url.trim();

    let entryPathname: string;
    let entryHref: string;

    try {
        // Based on location.href is not so reasonable, as it always changes.
        // The entry.url is expected to be absolute.
        const { pathname, href } = new URL(entry.url, location.href);
        entryPathname = pathname.toLowerCase();
        entryHref = href;
    } catch (e) {
        console.warn('Parse entry as URL failed: ', e);

        const { pathname, href } = parseUri(entry.url);
        entryPathname = pathname.toLowerCase();
        entryHref = href;
    }

    if (entryPathname.endsWith('.js')) {
        debug('Treat %s as a non-module JS entry.', entry);
        return {
            isJS: true,
            styles: [],
            scripts: [
                new ScriptNode({
                    src: entryHref,
                }),
            ],
        };
    }

    if (entryPathname.endsWith('.mjs')) {
        debug('Treat %s as a module JS entry.', entry);
        return {
            isJS: true,
            styles: [],
            scripts: [
                new ScriptNode({
                    src: entryHref,
                    type: 'module',
                }),
            ],
        };
    }

    const entryResponse = await fetchWithTimeoutAndRetry(
        entry.url,
        entry.requestInit,
        entry.timeout ?? FETCH_ENTRY_TIMEOUT,
        entry.retries
    );

    const contentType = (entryResponse.headers.get('Content-Type') || '').toLowerCase();
    const lastModified = entryResponse.headers.get('Last-Modified') ?? undefined;

    switch (true) {
        // JSON entry
        case entryPathname.endsWith('.json'):
        case contentType.includes('application/json'): {
            const exports = (await entryResponse.json()) as
                | Versionable<AssetsMap, 1>
                | Versionable<{ css: string[]; js: string[]; module?: AssetsModule }, 2>;

            debug('Detected a JSON entry %s: %O.', entry, exports);

            let fullAssetsMap: FullAssetsMap;

            if (exports.version === 2) {
                fullAssetsMap = fillAssetsMap({
                    module: exports.module || AssetsModule.UMD,
                    initial: {
                        css: exports.css,
                        js: exports.js,
                    },
                    async: {},
                });
            } else {
                fullAssetsMap = fillAssetsMap({
                    module: exports.module,
                    initial: exports.initial,
                    async: exports.async,
                });
            }

            const isModule = fullAssetsMap.module === AssetsModule.ESM ? 'module' : undefined;

            return {
                isJSON: true,
                lastModified,
                styles: fullAssetsMap.initial.css.map(css => new StyleNode({ href: toAbsolutePath(css, entryHref) })),
                scripts: (isModule ? fullAssetsMap.initial.js.slice(-1) : fullAssetsMap.initial.js).map(
                    js =>
                        new ScriptNode({
                            type: isModule,
                            src: toAbsolutePath(js, entryHref),
                        })
                ),
            };
        }
        // HTML entry
        case contentType.includes('text/html'):
        case contentType.includes('application/xhtml+xml'):
        case /\.(htm|[sx]?html)$/.test(entryPathname): {
            const htmlStr = await entryResponse.text();
            debug('Detected a HTML entry %s: %s.', entry, htmlStr);

            const doc = document.implementation.createHTMLDocument();
            const documentElement = doc.documentElement;
            documentElement.innerHTML = htmlStr;

            const scriptElements = Array.from(documentElement.querySelectorAll('script'));
            const styleNodes = Array.from(documentElement.querySelectorAll('link,style'));

            if (debug.enabled) {
                console.debug('<script/> queried:', scriptElements);
                console.debug('<style/> and <link/> queried:', styleNodes);
            }

            const scripts: ScriptNode[] = scriptElements.map(scriptElement => {
                const sn = ScriptNode.fromElement(scriptElement, entryHref);

                debug('Create a ScriptNode: %s.', sn);

                return sn;
            });

            const styles: StyleNode[] = styleNodes.map(node => {
                let sn: StyleNode;
                if (node.tagName.toUpperCase() === 'LINK') {
                    sn = StyleNode.fromLinkElement(node as HTMLLinkElement, entryHref);
                } else {
                    sn = StyleNode.fromStyleElement(node as HTMLStyleElement, entryHref);
                }

                debug('Create a StyleNode: %s.', sn);

                return sn;
            });

            return {
                isHTML: true,
                lastModified,
                headHTML: doc.head.innerHTML,
                bodyHTML: doc.body.innerHTML,
                title: doc.title,
                scripts,
                styles,
            };
        }
        // JS entry
        case contentType.includes('text/javascript'):
        case contentType.includes('application/javascript'):
        case contentType.includes('application/ecmascript'): {
            try {
                // If it's ESM, create a function will throw a SyntaxError.
                Function(await entryResponse.text());
            } catch (err: unknown) {
                if (
                    err instanceof SyntaxError &&
                    [
                        // v8(Chrome, node.js)
                        /Unexpected token 'export'/,
                        /Cannot use import statement outside a module/,
                        /Cannot use 'import.meta' outside a module/,
                        // Safari
                        /Unexpected keyword 'export'/,
                        /Unexpected identifier .+ import call expects exactly one argument/,
                        /import.meta is only valid inside modules/,
                        // Firefox
                        /(import|export) declarations may only appear at top level of a module/,
                        /import.meta may only appear in a module/,
                    ].find(reg => reg.test((err as SyntaxError).message))
                ) {
                    debug('Detected a ESM JavaScript entry: %s.', entry);
                    return {
                        isJS: true,
                        styles: [],
                        scripts: [
                            new ScriptNode({
                                type: 'module',
                                src: entryHref,
                            }),
                        ],
                    };
                }
            }

            debug('Detected a non-ESM JavaScript entry: %s.', entry);
            return {
                isJS: true,
                lastModified,
                styles: [],
                scripts: [
                    new ScriptNode({
                        src: entryHref,
                    }),
                ],
            };
        }
        default:
            throw Error(`Unrecognized entry format: ${entry.url}.`);
    }
}
