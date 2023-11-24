import type { JSExportType } from './Def';

interface Resource {
    css?: string[];
    js?: string[];
}

export type AssetsMap = {
    initial?: Resource;
    async?: Resource;
    module?: JSExportType;
};

export type FullAssetsMap = {
    initial: Required<Resource>;
    async: Required<Resource>;
    module: JSExportType;
};

export function fillAssetsMap(am: AssetsMap): FullAssetsMap {
    const fam: FullAssetsMap = {
        module: 'umd',
        initial: {
            css: [],
            js: [],
        },
        async: {
            css: [],
            js: [],
        },
    };

    fam.module = am.module || 'umd';

    const keys: Array<'initial' | 'async'> = ['initial', 'async'];

    keys.forEach(reskey => {
        if (am[reskey]) {
            for (const key of Object.keys(am[reskey] ?? {})) {
                if (key === 'css' || key === 'js') {
                    continue;
                } else {
                    console.warn(`${reskey}.${key} is unknown in ${JSON.stringify(am[reskey])}`);
                }
            }

            fam[reskey].css = am[reskey]?.css ?? [];
            fam[reskey].js = am[reskey]?.js ?? [];

            if (!Array.isArray(fam[reskey].css) || fam[reskey].css.some(k => 'string' !== typeof k || !k.trim())) {
                throw Error(
                    `Need ${reskey}.css that should be an array filled with strings in ${JSON.stringify(fam)}.`
                );
            }

            if (!Array.isArray(fam[reskey].js) || fam[reskey].js.some(k => 'string' !== typeof k || !k.trim())) {
                throw Error(`Need ${reskey}.js that should be an array filled with strings in ${JSON.stringify(fam)}.`);
            }
        } else {
            fam[reskey] = {
                css: [],
                js: [],
            };
        }
    });

    return fam;
}
