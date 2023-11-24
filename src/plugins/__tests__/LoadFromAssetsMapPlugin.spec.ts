import { createLoadFromAssetsMapPlugin } from '../../plugins/LoadFromAssetsMapPlugin';
import { baseDebugger } from '../../utils/Debugger';
import { App } from '../../App';

const debug = baseDebugger.extend('test:LoadFromAssetsMapPlugin');

describe.only('LoadFromAssetsMapPlugin', () => {
    it('load lifecycleFns from assetsMap with module=global', async () => {
        const jsUrl = `http://localhost:10810/resolveAssetsFromEntry/assetsMap.js?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                globalThis[Date.now()] = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                module: 'global',
                initial: {
                    js: [jsUrl],
                },
            },
        });

        createLoadFromAssetsMapPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('load lifecycleFns from assetsMap with module=umd', async () => {
        const jsUrl = `http://localhost:10810/resolveAssetsFromEntry/assetsMap.js?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                module.exports = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                module: 'umd',
                initial: {
                    js: [jsUrl],
                },
            },
        });

        createLoadFromAssetsMapPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('load lifecycleFns from assetsMap with module=undefined', async () => {
        const jsUrl = `http://localhost:10810/resolveAssetsFromEntry/assetsMap.js?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                module.exports = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                initial: {
                    js: [jsUrl],
                },
            },
        });

        createLoadFromAssetsMapPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('load lifecycleFns from assetsMap with module=module', async () => {
        const jsUrl = `http://localhost:10810/resolveAssetsFromEntry/assetsMap.js`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                module: 'module',
                initial: {
                    js: [jsUrl],
                },
            },
        });

        createLoadFromAssetsMapPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('load lifecycleFns from assetsMap with module=esm', async () => {
        const jsUrl = `http://localhost:10810/resolveAssetsFromEntry/assetsMap.js`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                module: 'esm',
                initial: {
                    js: [jsUrl],
                },
            },
        });

        createLoadFromAssetsMapPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('ignoreAsset works', async () => {
        const jsUrl = `http://localhost:10810/resolveAssetsFromEntry/assetsMap.js?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                module.exports = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                initial: {
                    js: [jsUrl],
                },
            },
            ignoreAsset: (src: string): boolean => /404/.test(src),
        });

        createLoadFromAssetsMapPlugin()({
            app: app.api,
            debug,
        });

        // ignoring absense asset leads to no error
        await expect(app.load()).resolves.toBeDefined();
    });
});
