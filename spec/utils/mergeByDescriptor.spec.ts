import { mergeByDescriptor } from '@/utils/mergeByDescriptor';

describe.only('mergeByDescriptor', () => {
    it("doesn't throw on failure", async () => {
        const dest = Object.create(null, {
            name: {
                value: 6,
                writable: true,
                configurable: false,
            },
        });

        const source = Object.create(null, {
            name: {
                get() {
                    return 7;
                },
                enumerable: true,
                configurable: false,
            },
        });

        mergeByDescriptor(dest, source);

        const descriptor = Reflect.getOwnPropertyDescriptor(dest, 'name');

        expect(Reflect.get(dest, 'name')).toBe(6);
        expect(descriptor?.configurable).toBe(false);
        expect(descriptor?.get).toBeUndefined();
    });

    it('only merge own properties', async () => {
        const dest = Object.create(null);

        const source = Object.create(
            {
                age: 'foo',
            },
            {
                name: {
                    get() {
                        return 7;
                    },
                    enumerable: false,
                    configurable: false,
                },
            }
        );

        mergeByDescriptor(dest, source);

        expect(Reflect.ownKeys(dest)).toEqual(['name']);
    });

    it('override from value to value', () => {
        const raw = Object.create(null, {
            foo: {
                value: 7,
                enumerable: true,
                writable: true,
                configurable: true,
            },
        });

        const impl = mergeByDescriptor(raw, {
            foo: 9,
        });

        const desc = Object.getOwnPropertyDescriptor(impl, 'foo');

        expect(desc?.value).toBe(9);
    });

    it('override from getter/setter to value', () => {
        const raw = Object.create(null, {
            foo: {
                value: 7,
                enumerable: true,
                writable: true,
                configurable: true,
            },
        });

        const impl = mergeByDescriptor(
            raw,
            Object.create(null, {
                foo: {
                    get() {
                        return 9;
                    },
                    set() {},
                    enumerable: true,
                    configurable: true,
                },
            })
        );

        const desc = Object.getOwnPropertyDescriptor(impl, 'foo');

        expect(desc?.get?.()).toBe(9);
    });

    it('override from getter/setter to getter/setter', () => {
        const raw = Object.create(null, {
            foo: {
                get() {
                    return 7;
                },
                set() {},
                enumerable: true,
                configurable: true,
            },
        });

        const impl = mergeByDescriptor(
            raw,
            Object.create(null, {
                foo: {
                    get() {
                        return 9;
                    },
                    set() {},
                    enumerable: true,
                    configurable: true,
                },
            })
        );

        const desc = Object.getOwnPropertyDescriptor(impl, 'foo');

        expect(desc?.get?.()).toBe(9);
    });

    it('override from value to getter/setter', () => {
        const raw = Object.create(null, {
            foo: {
                get() {
                    return 7;
                },
                enumerable: true,
                configurable: true,
            },
        });

        const impl = mergeByDescriptor(
            raw,
            Object.create(null, {
                foo: {
                    value: 9,
                    enumerable: true,
                    configurable: true,
                },
            })
        );

        const desc = Object.getOwnPropertyDescriptor(impl, 'foo');

        expect(desc?.value).toBe(9);
    });

    it('override symbol', async () => {
        const dest = Object.create(null, {
            [Symbol.for('x')]: {
                value: 6,
                writable: true,
                configurable: true,
            },
        });

        const source = Object.create(null, {
            [Symbol.for('x')]: {
                value: 99,
                enumerable: false,
                configurable: false,
            },
        });

        mergeByDescriptor(dest, source);

        const symbolDescriptor = Reflect.getOwnPropertyDescriptor(dest, Symbol.for('x'));

        expect(Reflect.get(dest, Symbol.for('x'))).toBe(99);
        expect(symbolDescriptor?.configurable).toBe(false);
        expect(symbolDescriptor?.value).toBeDefined();
    });
});
