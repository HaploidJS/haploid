import { createLoadFromAssetsMapPlugin } from '@/plugins/LoadFromAssetsMapPlugin';
import { baseDebugger } from '@/utils/Debugger';
import { App } from '@/App';
import { AssetsModule } from '@/index';

describe.only('LoadFromAssetsMapPlugin', () => {
    const debug = baseDebugger.extend('test:LoadFromAssetsMapPlugin');
    it('load lifecycleFns from assetsMap', async () => {
        const jsUrl = `http://localhost:10810/createLoadFromAssetsMapPlugin/assetsMap?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                globalThis[Date.now()] = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                module: AssetsModule.UMD,
                initial: {
                    js: [jsUrl],
                },
            },
            jsExportType: 'global',
        });

        createLoadFromAssetsMapPlugin()({
            app: app.api,
            debug,
        });

        await expect(app.load()).resolves.toBeDefined();
        expect(app.lifecycle.fns.raw).toBeDefined();
    });

    it('ignoreAsset works', async () => {
        const jsUrl = `http://localhost:10810/createLoadFromAssetsMapPlugin/assetsMap?headers=${encodeURIComponent(
            JSON.stringify({
                'Content-Type': `text/javascript;charset=utf-8`,
            })
        )}&content=${encodeURIComponent(`
                globalThis[Date.now()] = { mount(){}, unmount(){} };
            `)}`;

        const app = new App<unknown, unknown>({
            name: 'foo',
            assetsMap: {
                module: AssetsModule.UMD,
                initial: {
                    js: [jsUrl],
                },
            },
            jsExportType: 'global',
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
