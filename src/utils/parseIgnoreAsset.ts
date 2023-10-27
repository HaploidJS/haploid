import type { IgnoreAsset } from '../Def';
import { toArray } from './toArray';

const parseIgnoreAsset = (ignoreAsset?: IgnoreAsset): ((src: string) => boolean) => {
    const ignoreAssets = toArray(ignoreAsset);

    return (src: string): boolean => {
        for (const ignoreAsset of ignoreAssets) {
            if (!ignoreAsset) {
                continue;
            }

            if (ignoreAsset instanceof RegExp) {
                if (ignoreAsset.test(src)) {
                    return true;
                }
            } else if ('function' === typeof ignoreAsset) {
                if (ignoreAsset(src)) {
                    return true;
                }
            } else {
                console.warn(`Option ignoreAsset must be a function or regular expression.`);
            }
        }

        return false;
    };
};

export { parseIgnoreAsset };
