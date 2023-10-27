import { resolveAssetsFromEntry } from '../utils/resolveAssetsFromEntry';
import { parseIgnoreAsset } from '../utils/parseIgnoreAsset';

import { type Transformable, normalizeTransformable } from '../utils/Transformable';
import type { ScriptNode, StyleNode } from '../node/';
import type { AppPlugin } from '../Plugin';
import type { AppEntry, OptionsFromResolving } from '../Def';

declare module '../Def' {
    interface AppPluginOptions {
        entry?: Transformable<string | AppEntry>;
        /** Preserve DOM in &lt;head&gt; and &lt;body&gt; from HTML entry. */
        preserveHTML?: boolean;
        /** Ignore &lt;script&gt; or &lt;link&gt; mactched from entry. */
        ignoreAsset?: IgnoreAsset;
    }
}

// respect to qiankun
function getPublicPath(entry: string): string {
    try {
        const { origin, pathname } = new URL(entry, location.href);
        const paths = pathname.split('/');
        // remove last
        paths.pop();
        return `${origin}${paths.join('/')}/`;
    } catch (e) {
        console.warn(`Failed to get publicPath from ${entry}:`, e);
        return '';
    }
}

const parseEntry = (entry: string | AppEntry): AppEntry => {
    if ('string' === typeof entry) {
        return {
            url: entry,
        };
    }

    return entry;
};

const PLUGIN_NAME = 'LoadFromEntryPlugin';

export function createLoadFromEntryPlugin<AdditionalOptions, CustomProps>(): AppPlugin<AdditionalOptions, CustomProps> {
    return ({ app, debug }) => {
        const { options } = app;

        if (!('entry' in options)) {
            // Not consumed by this plugin.
            return;
        }

        debug('From entry: %O.', options.entry);

        const newEnv: Record<string, unknown> = {};

        async function loadFromEntry(): Promise<
            OptionsFromResolving & {
                scripts: ScriptNode[];
                styles: StyleNode[];
            }
        > {
            if (!options.entry) {
                throw Error(`"entry" cannot be ${String(options.entry)}.`);
            }

            const entry = parseEntry(await normalizeTransformable(options.entry));

            const assets = await resolveAssetsFromEntry(entry);

            debug('Assets resolved: %O.', assets);

            const { scripts, styles, isHTML, headHTML, bodyHTML, title } = assets;

            const ignoreAsset = parseIgnoreAsset(options.ignoreAsset);

            if (isHTML) {
                newEnv.__INJECTED_PUBLIC_PATH_BY_HAPLOID__ = getPublicPath(entry.url);
            }

            const preserveHTML =
                isHTML && 'undefined' === typeof options.preserveHTML ? true : Boolean(options.preserveHTML);

            return {
                presetHeadHTML: preserveHTML ? headHTML : undefined,
                presetBodyHTML: preserveHTML ? bodyHTML : undefined,
                title,
                baseURI: isHTML ? entry.url : undefined,
                scripts: scripts.filter(s => (s.src ? !ignoreAsset(s.src) : true)),
                styles: styles.filter(s => (s.href ? !ignoreAsset(s.href) : true)),
            };
        }

        app.hooks.resolveAssets.tapPromise(PLUGIN_NAME, () => {
            return loadFromEntry();
        });

        app.hooks.resolveEnvVariables.tap(PLUGIN_NAME, (env: Record<string, unknown>): Record<string, unknown> => {
            return {
                ...env,
                ...newEnv,
            };
        });
    };
}
