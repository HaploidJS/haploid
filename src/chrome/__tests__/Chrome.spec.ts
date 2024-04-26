import { ScriptNode } from '../..//node/ScriptNode';
import { StyleNode } from '../../node/StyleNode';
import { toArray } from '../../utils/toArray';
import { Chrome } from '../Chrome';
import { delay } from '../../../spec/test-utils';

beforeAll(() => {
    // https://github.com/jsdom/jsdom/issues/2740
    Reflect.setPrototypeOf(window, Window.prototype);
});

describe('constructor', () => {
    it('toString.call(chrome) === [object Chrome]', () => {
        expect(
            {}.toString.call(
                new Chrome({
                    name: 'foo',
                })
            )
        ).toBe('[object Chrome]');
    });

    it('htmlElement has attribute of "data-haploid-app"', () => {
        const chrome = new Chrome({
            name: 'foo',
        });
        expect(chrome.htmlElement.getAttribute('data-haploid-app')).toBe('foo');

        chrome.close();
    });

    it('relationship of htmlElement/headElement/bodyElement', () => {
        const chrome = new Chrome({
            name: 'foo',
        });
        expect(chrome.htmlElement.childElementCount).toBe(2);
        expect(chrome.headElement).toStrictEqual(chrome.htmlElement.firstElementChild);
        expect(chrome.bodyElement).toStrictEqual(chrome.htmlElement.lastElementChild);
        expect(chrome.titleElement.parentElement).toStrictEqual(chrome.headElement);

        chrome.close();
    });

    it('window is an instanceof Window', () => {
        expect(
            new Chrome({
                name: 'foo',
                sandbox: true,
            }).window
        ).toBeInstanceOf(Window);

        expect(
            new Chrome({
                name: 'foo',
                sandbox: false,
            }).window
        ).toStrictEqual(window);

        expect(window).toBeInstanceOf(Window);
    });

    it('headElement contains presetHeadHTML', async () => {
        const chrome = new Chrome({
            name: 'foo',
            presetHeadHTML: '<meta/><meta/><base/><title></title><link/>',
        });

        expect(chrome.headElement.childElementCount).toBe(3); // 2 meta and a haploid-title
        expect(chrome.headElement.querySelectorAll('meta')).toHaveLength(2);

        chrome.close();
    });

    it('bodyElement contains presetBodyHTML', async () => {
        const chrome = new Chrome({
            name: 'foo',
            baseURI: 'https://google.com/test/',
            presetBodyHTML: `<script></script>
                <base/>
                <title></title>
                <div class="root" contenteditable onclick=""></div>
                <img src="/a.png"/>`,
        });

        expect(chrome.bodyElement.childElementCount).toBe(2); // div
        // div
        expect(chrome.bodyElement.firstElementChild?.classList.contains('haploid-app-root')).toBe(true);
        expect(chrome.bodyElement.firstElementChild?.hasAttribute('contenteditable')).toBe(false);
        expect(chrome.bodyElement.firstElementChild?.hasAttribute('onclick')).toBe(false);
        // img
        expect(chrome.bodyElement.lastElementChild?.getAttribute('src')).toBe('https://google.com/a.png');

        chrome.close();
    });

    it('titleElement contains title', async () => {
        const chrome = new Chrome({
            name: 'foo',
            title: 'foo-title',
            sandbox: {
                enableTitlePretending: true,
            },
        });

        expect(chrome.window.document.title).toBe('foo-title');

        chrome.close();
    });
});

describe('executeEntryAndGetLifecycle', () => {
    it('throws if jsExportType=unknown', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            // @ts-ignore test
            jsExportType: 'unknown',
        });
        await expect(
            chrome.executeEntryAndGetLifecycle(
                new ScriptNode({
                    content: `xxx`,
                })
            )
        ).rejects.toThrow(/Unknown jsExportType/);
    });
    it('jsExportType=global', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'global',
        });
        const lf = await chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                content: `globalThis[Math.random()] = {mount(){return 789},unmount(){}}`,
            })
        );
        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toEqual(789);
    });

    it('has no module/exports/require when jsExportType=global', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'global',
        });
        const lf = await chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                content: `globalThis[Math.random()] = {mount(){return [typeof module, typeof exports, typeof require]},unmount(){}}`,
            })
        );
        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toMatchObject(['undefined', 'undefined', 'undefined']);
    });

    it('throw error if js illegal when jsExportType=global', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'global',
        });

        const lf = chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                content: `)()`,
            })
        );
        await expect(lf).rejects.toThrow();
    });

    it('throw error if js illegal when jsExportType=umd', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'umd',
        });

        const lf = chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                content: `)()`,
            })
        );
        await expect(lf).rejects.toThrow();
    });

    it('jsExportType=esm', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'esm',
        });

        const lf = await chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                src: 'http://localhost:10810/chrome/esm.js',
            })
        );

        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toEqual(789);
    });

    it('jsExportType=umd', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'umd',
        });
        const lf = await chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                content: `if(typeof exports === 'object' && typeof module === 'object')module.exports = {mount(){return 789},unmount(){}}`,
            })
        );

        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toEqual(789);
    });

    it('require external when jsExportType=umd', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'umd',
            presetBodyHTML: '<div id="foo"></foo>',
            externals: {
                jquery: function (selector: string): Element | null {
                    return chrome.window.document.querySelector(selector);
                },
            },
        });
        const lf = await chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                content: `const $ = require('jquery');if(typeof exports === 'object' && typeof module === 'object') module.exports = {mount(){return $('#foo');},unmount(){}}`,
            })
        );

        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toBeInstanceOf(Element);
    });

    it('refer to isESM when jsExportType=undefined', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });
        const lf = await chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                content: `if(typeof exports === 'object' && typeof module === 'object')module.exports = {mount(){return 789},unmount(){}}`,
            })
        );

        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toEqual(789);
    });

    it('refer to isESM when jsExportType=undefined', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });
        const lf = await chrome.executeEntryAndGetLifecycle(
            new ScriptNode({
                src: 'http://localhost:10810/chrome/esm.js',
                type: 'module',
            })
        );

        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toEqual(789);
    });
});

describe('load', () => {
    let chrome: Chrome;

    beforeEach(() => {
        chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });
    });

    afterEach(() => {
        chrome?.close();
    });

    it('throws immediately if closed', async () => {
        chrome.close();

        await expect(
            chrome.load(
                new ScriptNode({
                    content: ';',
                })
            )
        ).rejects.toThrow(/has been closed/);
    });

    it('throws if closed during loading', async () => {
        const openPromise = chrome.load(
            new ScriptNode({
                content: 'module.exports={mount(){},unmount(){}}',
            }),
            [],
            [],
            [
                new StyleNode({
                    href: `//localhost:10810/chrome/Chrome/style.css?content=${encodeURIComponent(
                        `.foo{color:red}`
                    )}&delay=400`,
                }),
            ]
        );

        await delay(200);

        chrome.close();

        await expect(openPromise).rejects.toThrow(/has been closed/);
    });

    it('<style> elements are injected in order in "head"', async () => {
        await chrome.load(
            new ScriptNode({
                content: 'module.exports={mount(){},unmount(){}}',
            }),
            [],
            [],
            [
                new StyleNode({
                    href: `//localhost:10810/chrome/Chrome/style.css?content=${encodeURIComponent(
                        `.foo{color:red}`
                    )}&delay=400`,
                }),
                new StyleNode({
                    href: `//localhost:10810/chrome/Chrome/style.css?content=${encodeURIComponent(
                        `#app{font-size:14px}`
                    )}&delay=200`,
                }),
            ]
        );

        const styles = chrome.headElement.querySelectorAll('style');
        expect(styles).toHaveLength(2);
        expect(styles[0].textContent).toContain('.foo{color:red}');
        expect(styles[1].textContent).toContain('#app{font-size:14px}');
    });

    it('dependencies scripts are evaluated in order', async () => {
        await chrome.load(
            new ScriptNode({
                content: 'module.exports={mount(){return window.records},unmount(){}}',
            }),
            [
                new ScriptNode({
                    src: `//localhost:10810/chrome/Chrome/base0.js?content=${encodeURIComponent(
                        `window.records = []`
                    )}&delay=800`,
                }),
                new ScriptNode({
                    src: `//localhost:10810/chrome/Chrome/base1.js?content=${encodeURIComponent(
                        `window.records.push(1)`
                    )}&delay=200`,
                }),
                new ScriptNode({
                    src: `//localhost:10810/chrome/Chrome/base2.js?content=${encodeURIComponent(
                        `window.records.push(2)`
                    )}&delay=600`,
                }),
            ]
        );

        const lf = chrome.lifecycleFns;

        const mounts = toArray(lf?.mount ?? []);
        expect(mounts[0]({ name: 'foo' })).toEqual([1, 2]);
    });

    it('has no module/exports/require if not entry when UMD', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            jsExportType: 'umd',
            presetBodyHTML: '<div id="foo"></foo>',
        });
        await chrome
            .load(null, [
                new ScriptNode({
                    content: `window.result = [typeof module, typeof exports, typeof require];`,
                    entry: false,
                }),
            ])
            .catch(e => e);

        expect(Reflect.get(chrome.window, 'result')).toMatchObject(['undefined', 'undefined', 'undefined']);
    });

    it('timeout works', async () => {
        const chrome = new Chrome({
            name: 'foo',
            fetchResourceOptions: {
                timeout: 200,
            },
        });

        const open = chrome.launch({
            styles: [],
            scripts: [
                new ScriptNode({
                    src: `//localhost:10810/chrome/Chrome/timeout.js?delay=300&content=${encodeURIComponent(
                        `module.exports={mount(){},unmount(){}}`
                    )}`,
                }),
            ],
        });

        await expect(open).rejects.toThrow(/200ms/);

        chrome.close();
    });

    it.todo('retries');
});

describe('launch', () => {
    let chrome: Chrome;

    beforeEach(() => {
        chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });
    });

    afterEach(() => {
        chrome?.close();
    });

    it('throws if closed', async () => {
        chrome.close();
        await expect(chrome.launch({ scripts: [], styles: [] })).rejects.toThrow(/closed/);
    });

    it('loading, load', async () => {
        const win = chrome.windowShadow;

        const onLoading = jest.spyOn(win, 'onLoading');
        const onLoad = jest.spyOn(win, 'onLoad');

        await chrome.launch({ scripts: [], styles: [] });

        expect(onLoading).toHaveBeenCalledTimes(1);
        expect(onLoad).toHaveBeenCalledTimes(1);
    });

    it('options.urlRewrite is called', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
            urlRewrite(url): string {
                return url.replace('ftp', 'http');
            },
        });

        const launchPromise = chrome.launch({
            scripts: [
                new ScriptNode({
                    src: `ftp://localhost:10810/chrome/esm.js`,
                    type: 'module',
                }),
            ],
            styles: [],
        });

        await expect(launchPromise).resolves.toBeUndefined();
    });

    it('analysed', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });

        const load = jest.spyOn(chrome, 'load');

        await chrome.launch({
            scripts: [
                new ScriptNode({
                    src: `//localhost:10810/chrome/esm.js?content=`,
                    type: 'basic',
                    entry: false,
                }),
            ],
            styles: [],
        });

        expect(load).toHaveBeenLastCalledWith(null, [], [], []);
    });
});

describe('dynamic <script>', () => {
    it('dynamic <script> fire events and read document.currentScript', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });

        const dynamicUrl = `//localhost:10810/chrome/Chrome/success.js?content=${encodeURIComponent(
            `const docScript = document.currentScript;

                window.ondynamicscriptload(
                    docScript.type === 'text/javascript' &&
                        docScript.crossOrigin === 'anonymous' &&
                        docScript.hasAttribute('defer') &&
                        docScript.src.includes("/chrome/Chrome/success.js")
                );
                `
        )}`;

        const entryUrl = `//localhost:10810/chrome/Chrome/dynamic-script.js?content=${encodeURIComponent(
            `const dynamicScriptResults = [];
                let docCurrentScriptCorrect = document.currentScript.src.includes('/chrome/Chrome/dynamic-script.js');

                window.ondynamicscriptload = result => {
                    docCurrentScriptCorrect = docCurrentScriptCorrect && result;
                };

                function bootstrap() {
                    const script = document.createElement('script');
                    const script2 = document.createElement('script');

                    script.src = "${dynamicUrl}";
                    script.type = 'text/javascript';
                    script.defer = true;
                    script.crossOrigin = 'anonymous';
                    script2.src = '/fixtures/404.js';

                    const p = new Promise(resolve => {
                        script.addEventListener('load', () => {
                            dynamicScriptResults.push('load');
                            resolve();
                        });
                        script.addEventListener('error', () => {
                            resolve();
                        });
                    });

                    const p2 = new Promise(resolve => {
                        script2.addEventListener('load', () => {
                            resolve();
                        });
                        script2.addEventListener('error', () => {
                            dynamicScriptResults.push('error');
                            resolve();
                        });
                    });

                    document.head.append(script);
                    document.head.append(script2);

                    return Promise.resolve(p).then(() => p2);
                }

                module.exports = {
                    bootstrap,
                    mount() {
                        return [dynamicScriptResults, docCurrentScriptCorrect];
                    },
                    unmount() {},
                };
                `
        )}`;

        await chrome.launch({
            styles: [],
            scripts: [
                new ScriptNode({
                    src: entryUrl,
                }),
            ],
        });

        const lf = chrome.lifecycleFns;

        const bootstraps = toArray(lf?.bootstrap);
        const mounts = toArray(lf?.mount ?? []);

        if (bootstraps[0]) await bootstraps[0]({ name: 'foo' });

        const arr = mounts[0]({ name: 'foo' });

        // script fires load and error events
        expect(Reflect.get(arr, 0)).toEqual(expect.arrayContaining(['load', 'error']));
        // read document.currentScript correctly
        expect(Reflect.get(arr, 1)).toEqual(true);

        chrome.close();
    });

    it('dynamic <script> still fire load after evaluating failed', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });

        const dynamicUrl = `//localhost:10810/chrome/Chrome/fail.js?content=${encodeURIComponent(`syntax;`)}`;

        const entryUrl = `//localhost:10810/chrome/Chrome/dynamic-script.js?content=${encodeURIComponent(
            `const dynamicScriptResults = [];

                function bootstrap() {
                    const script = document.createElement('script');

                    script.src = "${dynamicUrl}";
                    script.type = 'text/javascript';
                    script.defer = true;
                    script.crossOrigin = 'anonymous';

                    const p = new Promise(resolve => {
                        script.addEventListener('load', () => {
                            dynamicScriptResults.push('load');
                            resolve();
                        });
                        script.addEventListener('error', () => {
                            dynamicScriptResults.push('error');
                            resolve();
                        });
                    });

                    document.head.append(script);

                    return Promise.resolve(p);
                }

                module.exports = {
                    bootstrap,
                    mount() {
                        return dynamicScriptResults;
                    },
                    unmount() {},
                };
                `
        )}`;

        await chrome.launch({
            styles: [],
            scripts: [
                new ScriptNode({
                    src: entryUrl,
                }),
            ],
        });

        const lf = chrome.lifecycleFns;

        const bootstraps = toArray(lf?.bootstrap);
        const mounts = toArray(lf?.mount ?? []);

        if (bootstraps[0]) await bootstraps[0]({ name: 'foo' });

        const arr = mounts[0]({ name: 'foo' });

        // script fires load even syntax error
        expect(arr).toEqual(expect.arrayContaining(['load']));

        chrome.close();
    });
});

describe('dynamic <link>', () => {
    it('dynamic <link> fire events', async () => {
        const chrome = new Chrome({
            name: 'foo',
            sandbox: true,
        });

        const dynamicUrl = `//localhost:10810/chrome/Chrome/success.css?content=${encodeURIComponent(
            `#foo { color: red }
                `
        )}`;

        const entryUrl = `//localhost:10810/chrome/Chrome/dynamic-link.js?content=${encodeURIComponent(
            `const dynamicLinkResults = [];

                function bootstrap() {
                    const link = document.createElement('link');
                    const link2 = document.createElement('link');

                    link.href = "${dynamicUrl}";
                    link.rel = 'stylesheet';
                    link.crossOrigin = 'anonymous';
                    link2.href = '/fixtures/404.css';

                    const p = new Promise(resolve => {
                        link.addEventListener('load', () => {
                            dynamicLinkResults.push('load');
                            resolve();
                        });
                        link.addEventListener('error', () => {
                            resolve();
                        });
                    });

                    const p2 = new Promise(resolve => {
                        link2.addEventListener('load', () => {
                            resolve();
                        });
                        link2.addEventListener('error', () => {
                            dynamicLinkResults.push('error');
                            resolve();
                        });
                    });

                    document.head.append(link);
                    document.head.append(link2);

                    return Promise.resolve(p).then(() => p2);
                }

                module.exports = {
                    bootstrap,
                    mount() {
                        return [dynamicLinkResults];
                    },
                    unmount() {},
                };
                `
        )}`;

        await chrome.launch({
            styles: [],
            scripts: [
                new ScriptNode({
                    src: entryUrl,
                }),
            ],
        });

        const lf = chrome.lifecycleFns;

        const bootstraps = toArray(lf?.bootstrap);
        const mounts = toArray(lf?.mount ?? []);

        if (bootstraps[0]) await bootstraps[0]({ name: 'foo' });

        const arr = mounts[0]({ name: 'foo' });

        // link fires load and error events
        expect(Reflect.get(arr, 0)).toEqual(expect.arrayContaining(['load', 'error']));

        chrome.close();
    });
});

// TODO should not be here
it('auto events in right order', async () => {
    const chrome = new Chrome({
        name: 'foo',
        sandbox: {
            autoDocumentEvents: ['DOMContentLoaded', 'readystatechange'],
            autoWindowEvents: ['beforeunload', 'load'],
        },
    });

    let DOMContentLoadedTime = 0;
    let readystatechangeInteractiveTime = 0;
    let readystatechangeCompleteTime = 0;
    let loadTime = 0;

    chrome.window.document.addEventListener('DOMContentLoaded', () => {
        DOMContentLoadedTime = Date.now();
    });

    chrome.window.document.addEventListener('readystatechange', () => {
        if (chrome.window.document.readyState === 'interactive') readystatechangeInteractiveTime = Date.now();
        else if (chrome.window.document.readyState === 'complete') readystatechangeCompleteTime = Date.now();
    });

    chrome.window.addEventListener('load', () => {
        loadTime = Date.now();
    });

    await chrome.launch({ scripts: [], styles: [] }).catch(() => {});

    const timeArray = [readystatechangeInteractiveTime, DOMContentLoadedTime, readystatechangeCompleteTime, loadTime];

    expect(timeArray.slice().sort()).toEqual<number[]>(timeArray);

    const beforeunloadFn = jest.fn();
    chrome.window.addEventListener('beforeunload', beforeunloadFn);
    chrome.close();

    expect(beforeunloadFn).toHaveBeenCalled();
});
