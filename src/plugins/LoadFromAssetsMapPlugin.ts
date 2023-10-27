import { Transformable, normalizeTransformable } from '../utils/Transformable';
import { parseIgnoreAsset } from '../utils/parseIgnoreAsset';
import { toAbsolutePath } from '../utils/url';

import { AssetsMap, fillAssetsMap, AssetsModule } from '../AssetsMap';
import { ScriptNode, StyleNode } from '../node/';
import type { AppPlugin } from '../Plugin';

declare module '../Def' {
    interface AppPluginOptions {
        /** Assets of CSS and JS. */
        assetsMap?: Transformable<AssetsMap>;
        /** Ignore &lt;script&gt; or &lt;link&gt; mactched from entry. */
        ignoreAsset?: IgnoreAsset;
    }
}

const PLUGIN_NAME = 'LoadFromAssetsMapPlugin';

export function createLoadFromAssetsMapPlugin<AdditionalOptions, CustomProps>(): AppPlugin<
    AdditionalOptions,
    CustomProps
> {
    return ({ app, debug }) => {
        const { options } = app;

        if (!('assetsMap' in options)) {
            // Not consumed by this plugin.
            return;
        }

        debug('From assetsMap: %O.', options.assetsMap);

        async function loadFromAssetsMap(): Promise<{ scripts: ScriptNode[]; styles: StyleNode[] }> {
            if (!options.assetsMap) {
                throw Error(`"assetsMap" cannot be ${String(options.assetsMap)}.`);
            }

            const ignoreAsset = parseIgnoreAsset(options.ignoreAsset);
            const fullAssetsMap = fillAssetsMap(await normalizeTransformable<AssetsMap>(options.assetsMap));

            const cssAssets = fullAssetsMap.initial.css;
            const jsAssets = fullAssetsMap.initial.js;

            const scripts: ScriptNode[] = [];

            const styles: StyleNode[] = cssAssets.map(css => new StyleNode({ href: css }));

            if (fullAssetsMap.module === AssetsModule.ESM) {
                // Keep the last one in ESM mode.
                scripts.push(new ScriptNode({ src: toAbsolutePath(jsAssets.pop()), type: 'module' }));
            } else {
                // Keep all.
                for (const js of jsAssets) {
                    scripts.push(new ScriptNode({ src: toAbsolutePath(js) }));
                }
            }

            return {
                scripts: scripts.filter(s => (s.src ? !ignoreAsset(s.src) : true)),
                styles: styles.filter(s => (s.href ? !ignoreAsset(s.href) : true)),
            };
        }

        app.hooks.resolveAssets.tapPromise(PLUGIN_NAME, () => {
            return loadFromAssetsMap();
        });
    };
}
