import { createLoadFromEntryPlugin } from '@/plugins/LoadFromEntryPlugin';
import { App } from '@/App';
import { baseDebugger } from '@/utils/Debugger';
import { toArray } from '@/utils/toArray';

describe.only('LoadFromEntryPlugin', () => {
    const debug = baseDebugger.extend('test:LoadFromEntryPlugin');
    it('load lifecycleFns from entry', async () => {
        const entryUrl = `//localhost:10810/createLoadFromEntryPlugin/foo-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                globalThis[Date.now()] = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            entry: entryUrl,
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('load lifecycleFns from object entry', async () => {
        const entryUrl = `//localhost:10810/createLoadFromEntryPlugin/foo-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                globalThis[Date.now()] = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            entry: {
                url: entryUrl,
            },
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('load lifecycleFns from promise entry', async () => {
        const entryUrl = `//localhost:10810/createLoadFromEntryPlugin/foo-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                globalThis[Date.now()] = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            entry: Promise.resolve(entryUrl),
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('load lifecycleFns from function entry', async () => {
        const entryUrl = `//localhost:10810/createLoadFromEntryPlugin/foo-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                globalThis[Date.now()] = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            entry: async (): Promise<string> => entryUrl,
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('envVariable __INJECTED_PUBLIC_PATH_BY_HAPLOID__ is injected under HTML entry', async () => {
        const entryUrl = `//localhost:10810/createLoadFromEntryPlugin/foo-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/html;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
        <!DOCTYPE html>
        <html lang="zh-CN">
            <head>
            </head>
            <body>
            <script>
                const publicPath = globalThis.__INJECTED_PUBLIC_PATH_BY_HAPLOID__;
                globalThis[Date.now()] = { mount(){}, unmount(){ return publicPath; } };
            </script>
            </body>
        </html>

            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            entry: entryUrl,
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        const resolveEnvVariables = jest.fn();

        app.hooks.resolveEnvVariables.tap('test', (env: Record<string, unknown>): Record<string, unknown> => {
            resolveEnvVariables();
            return {
                ...env,
            };
        });

        const lifecycleFns = await app.load();

        expect(resolveEnvVariables).toHaveBeenCalled();

        const unmounts = toArray(lifecycleFns.unmount);

        expect(
            unmounts[0]({
                name: app.name,
            })
        ).toMatch('//localhost:10810/createLoadFromEntryPlugin/');
    });

    it('ignoreAsset works', async () => {
        const entryUrl = `//localhost:10810/createLoadFromEntryPlugin/foo-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/html;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
        <!DOCTYPE html>
        <html lang="zh-CN">
            <head>
            </head>
            <body>
                <script src="./404.js"></script>
                <script>
                    globalThis[Date.now()] = { mount(){}, unmount(){} };
                </script>
            </body>
        </html>

            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            entry: entryUrl,
            ignoreAsset: (src: string): boolean => /404/.test(src),
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        // ignoring absense asset leads to no error
        await expect(app.load()).resolves.toBeDefined();
    });

    it('preserveHTML works', async () => {
        const entryUrl = `//localhost:10810/createLoadFromEntryPlugin/foo-entry?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/html;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
        <!DOCTYPE html>
                <html>
                    <head>
                        <meta name="keywords">
                        <title>FOO</title>
                        <link/>
                        <base/>
                    </head>
                    <body><!--COMMENT-->
                        <div id="root"></div>
                        <base/>
                        <title></title>
                        <script entry>window[Date.now()] = {mount(){},unmount(){}}</script>
                        TEXT
                    </body>
                </html>
            `)}`;

        let app = new App<unknown, unknown>({
            name: 'foo',
            entry: entryUrl,
            // default true in HTML
            // preserveHTML: true,
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        await app.start();

        expect(app.appElement?.querySelector('haploid-head>meta')?.getAttribute('name')).toBe('keywords');
        expect(app.appElement?.querySelector('haploid-head>link')).toBeNull();
        expect(app.appElement?.querySelector('haploid-head>base')).toBeNull();
        expect(app.appElement?.querySelector('haploid-body>div#root')).not.toBeNull();
        expect(app.appElement?.querySelector('haploid-body')?.firstChild?.nodeValue).toBe('COMMENT');
        expect(app.appElement?.querySelector('haploid-body')?.textContent).toContain('TEXT');
        expect(app.appElement?.querySelector('haploid-body>haploid-script')).not.toBeNull();
        expect(app.appElement?.querySelector('haploid-body>link')).toBeNull();
        expect(app.appElement?.querySelector('haploid-body>base')).toBeNull();

        app = new App<unknown, unknown>({
            name: 'foo',
            entry: entryUrl,
            preserveHTML: false,
        });

        createLoadFromEntryPlugin()({
            app: app.api,
            debug,
        });

        await app.start();

        expect(app.appElement?.querySelector('haploid-head>meta')).toBeNull();
        expect(app.appElement?.querySelector('haploid-body>div#root')).toBeNull();
    });
});
