import { ScopedEvaluator } from '../ScopedEvaluator';

describe('strict', () => {
    it('strict is true by default', async () => {
        const se = new ScopedEvaluator({});
        expect(se.isStrict).toBe(true);
    });
    it('strict is true', async () => {
        const se = new ScopedEvaluator({ useStrict: true });
        expect(se.isStrict).toBe(true);
    });
    it('strict is true', async () => {
        const se = new ScopedEvaluator({ useStrict: false });
        expect(se.isStrict).toBe(false);
    });

    it('strict is false if useStrict === 0', async () => {
        // @ts-ignore test
        const se = new ScopedEvaluator({ useStrict: 0 });
        expect(se.isStrict).toBe(false);
    });

    it('strict is false if useStrict === ""', async () => {
        // @ts-ignore test
        const se = new ScopedEvaluator({ useStrict: '' });
        expect(se.isStrict).toBe(false);
    });

    it('strict is false if useStrict === NaN', async () => {
        // @ts-ignore test
        const se = new ScopedEvaluator({ useStrict: NaN });
        expect(se.isStrict).toBe(false);
    });
});

describe('ctxKey and envKey', () => {
    it('ctxKey is defined on window and non-enumerable', async () => {
        const se = new ScopedEvaluator({});
        const desc = Reflect.getOwnPropertyDescriptor(window, se.ctxKey);
        expect(desc).toBeDefined();
        expect(desc?.configurable).toBe(true);
        expect(desc?.enumerable).toBe(false);
        expect(desc?.set).toBeUndefined();
        expect(desc?.get).toBeDefined();
    });

    it('envKey is defined on window and non-enumerable', async () => {
        const se = new ScopedEvaluator({});
        const desc = Reflect.getOwnPropertyDescriptor(window, se.envKey);
        expect(desc).toBeDefined();
        expect(desc?.configurable).toBe(true);
        expect(desc?.enumerable).toBe(false);
        expect(desc?.set).toBeUndefined();
        expect(desc?.get).toBeDefined();
    });
});

describe('patchEnv()', () => {
    it('filter illegal variable names', () => {
        const se = new ScopedEvaluator({
            env: {
                '@32': 1,
                '+32': 1,
                '32': 1,
                m32: 1,
            },
        });
        const names = se.patchEnv();

        expect(names).toHaveLength(1);
    });

    it('filter keys beyond "keys"', () => {
        const se = new ScopedEvaluator({
            env: Object.create(
                {
                    PROTO_KEY: 2,
                },
                {
                    NON_ENUM_KEY: {
                        value: 2,
                        enumerable: false,
                    },
                    [Symbol('SYMBOL_KEY')]: {
                        value: 2,
                        enumerable: true,
                    },
                    NORMAL_KEY: {
                        value: 2,
                        enumerable: true,
                    },
                }
            ),
        });
        const names = se.patchEnv();

        expect(names).toHaveLength(1);
        expect(se.env).toMatchObject({ NORMAL_KEY: 2 });
    });

    it('with env parameters', () => {
        const se = new ScopedEvaluator({
            env: {
                __DEV__: 1,
            },
        });

        se.patchEnv({ __DEV__: 2 });

        expect(se.env).toMatchObject({ __DEV__: 2 });
    });

    it('keep base env', async () => {
        const se = new ScopedEvaluator({
            env: {
                __DEV__: 1,
            },
        });
        se.patchEnv({ __DEV__: 2 });
        se.patchEnv({ __D__: 2 });

        expect(se.env).toMatchObject({ __DEV__: 1, __D__: 2 });
    });
});

describe('evaluate', () => {
    it('visit env directly', () => {
        const se = new ScopedEvaluator({ env: { __DEV__: true } });
        se.evaluate('window.__DEV__ = __DEV__ + 1');
        expect(Reflect.get(window, '__DEV__')).toBe(2);
    });

    it('this is undefined if strict', () => {
        const se = new ScopedEvaluator({ useStrict: true, global: window });
        se.evaluate('window.__SELF__ = this');
        expect(Reflect.get(window, '__SELF__')).toBeUndefined();
    });

    it('this is window if non-strict', () => {
        const se = new ScopedEvaluator({ useStrict: false, global: window });
        se.evaluate('window.__SELF__ = this');
        expect(Reflect.get(window, '__SELF__')).toStrictEqual(window);
    });

    it('with new env', () => {
        const env: Record<string, unknown> = { __DEV__: 1 };
        const se = new ScopedEvaluator({ env });
        se.evaluate('window.__DEV__ = __DEV__');
        expect(Reflect.get(window, '__DEV__')).toBe(1);
        env.__DEV__ = 2;
        se.evaluate('window.__DEV__ = __DEV__');
        expect(Reflect.get(window, '__DEV__')).toBe(2);
    });

    it('with addtional env', async () => {
        const se = new ScopedEvaluator({ env: { __DEV__: 1 } });
        se.evaluate('window.__DEV__ = __DEV__', { __DEV__: 2 });
        expect(Reflect.get(window, '__DEV__')).toBe(2);
    });
});
