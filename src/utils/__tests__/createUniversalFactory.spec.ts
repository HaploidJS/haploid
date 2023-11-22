import { createUniversalFactory } from '../../utils/createUniversalFactory';

import { uuid } from '../../../spec/test-utils';

let envIndex = 0;

function createEnv<T extends { version: number }>(
    allowConflict: boolean,
    presetKey?: keyof Window
): {
    get: () => T;
    version: number;
    key: keyof Window;
} {
    envIndex++;
    const keys = {
        resolverKey: presetKey || (`__HAPLOID_FOO_RESOLVER__${envIndex}` as keyof Window),
    };

    const versionValue = Date.now();

    class Foo {
        public get version(): number {
            return versionValue;
        }
    }

    return {
        get get(): () => T {
            return createUniversalFactory<T>(keys.resolverKey, () => new Foo() as T, versionValue, allowConflict);
        },
        version: versionValue,
        key: keys.resolverKey,
    };
}

describe('createUniversalFactory.basic', () => {
    const { get, version, key } = createEnv(false);

    it(`only one instance created`, () => {
        expect(get()).toBe(get());
    });

    it(`define ${key} under window`, () => {
        expect(window[key]).toBe(get());
    });

    it(`window.${key} is not configurable/enumerable/writable`, () => {
        const des = Object.getOwnPropertyDescriptor(window, key);
        expect(des?.configurable).toBe(false);
        expect(des?.enumerable).toBe(false);
        expect(des?.writable).toBe(false);
    });

    it(`has an idempotent version getter on prototype`, () => {
        const foo = get();
        const des = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(foo), 'version');
        expect(des?.get).toBeTruthy();
        expect(des?.set).toBeFalsy();

        expect(foo.version).toBe(version);
    });
});

describe('createUniversalFactory.conflict', () => {
    it('return object that matches version', () => {
        const presetKey = uuid() as keyof Window;
        const { get, version } = createEnv(false, presetKey);

        const obj = {
            version,
        };

        Reflect.defineProperty(window, presetKey, {
            value: obj,
        });

        expect(get()).toStrictEqual(get());
        expect(get()).toStrictEqual(obj);
    });

    it('throw if version conflict', () => {
        const presetKey = uuid() as keyof Window;
        const { get } = createEnv(false, presetKey);

        const obj = {
            version: Math.random(),
        };

        Reflect.defineProperty(window, presetKey, {
            value: obj,
        });

        expect(() => get()).toThrow();
    });

    it('throw if conflict', () => {
        const presetKey = uuid() as keyof Window;
        const { get } = createEnv(false, presetKey);

        Reflect.defineProperty(window, presetKey, {
            set() {},
        });

        expect(() => get()).toThrow();
    });
});
