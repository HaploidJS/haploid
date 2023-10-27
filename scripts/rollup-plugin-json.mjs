import { createFilter, dataToEsm } from '@rollup/pluginutils';
import pick from 'lodash/pick.js';

export default function json(options = {}) {
    const filter = createFilter(options.include, options.exclude);

    return {
        name: 'json',
        transform(json, id) {
            if (!id.endsWith('.json') || !filter(id)) {
                return null;
            }

            let parsed = JSON.parse(json);

            if ('keys' in options) {
                const keys = options.keys;
                if (!Array.isArray(keys) || keys.length === 0 || keys.findIndex(key => 'string' !== typeof key) > -1) {
                    throw Error('Option keys must be a non-empty array includes strings.');
                }

                parsed = pick(parsed, options.keys);
            }

            return {
                code: dataToEsm(parsed, {
                    preferConst: options.preferConst ?? true,
                    compact: options.compact ?? true,
                    namedExports: options.namedExports ?? true,
                    indent: options.indent ?? '\t',
                }),
                map: { mappings: '' },
            };
        },
    };
}
