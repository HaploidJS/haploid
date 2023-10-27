import { NodeProxy } from '@/chrome/BOM/NodeProxy';

interface Plain extends EventTarget {
    [key: string]: unknown;
}

class PlainNode extends NodeProxy<Plain> {
    protected getBuiltInShadow(): Record<string, unknown> {
        return {};
    }

    protected beforeDefineProperty(): void {}
    protected afterDefineProperty(): void {}
    protected beforeDeleteProperty(): void {}
    protected afterDeleteProperty(): void {}
    protected beforeSet(): void {}
    protected afterSet(): void {}
    public onDestroy(): void {}
    public onLoad(): void {}
    public onLoading(): void {}
    protected get debugName(): string {
        return 'test:plain';
    }
}

const ready = (): [Plain, NodeProxy<Plain>] => {
    const raw = Object.create(
        Object.create(null, {
            protoConfigurableValueVar: {
                value: 'protoConfigurableValueVar',
                writable: true,
                configurable: true,
            },
            protoNonConfigurableValueVar: {
                value: 'protoNonConfigurableValueVar',
                writable: true,
                configurable: false,
            },
            protoEscapedConfigurableValueVar: {
                value: 'protoEscapedConfigurableValueVar',
                writable: true,
                configurable: true,
            },
            protoEscapedNonConfigurableValueVar: {
                value: 'protoEscapedNonConfigurableValueVar',
                writable: true,
                configurable: false,
            },
        }),
        {
            rawConfigurableValueVar: {
                value: 'rawConfigurableValueVar',
                writable: true,
                configurable: true,
            },
            rawNonConfigurableValueVar: {
                value: 'rawNonConfigurableValueVar',
                writable: true,
                configurable: false,
            },
            rawEscapedConfigurableValueVar: {
                value: 'rawEscapedConfigurableValueVar',
                writable: true,
                configurable: true,
            },
            rawEscapedNonConfigurableValueVar: {
                value: 'rawEscapedNonConfigurableValueVar',
                writable: true,
                configurable: false,
            },
        }
    );
    const node = new PlainNode(
        'test',
        raw,
        {
            shadowValueVar: 'shadowValueVar',
        },
        {
            // escapeKeys, but shadowValueVar cannot work
            escapeKeys: [
                'shadowValueVar',
                'bar',
                'baz',
                'protoEscapedConfigurableValueVar',
                'protoEscapedNonConfigurableValueVar',
                'rawEscapedConfigurableValueVar',
                'rawEscapedNonConfigurableValueVar',
            ],
        }
    );

    return [raw, node];
};

/// start

describe('new property', () => {
    describe('new property set ', () => {
        let raw: Plain;
        let node: NodeProxy<Plain>;
        let defined = false;
        beforeEach(() => {
            [raw, node] = ready();
            defined = Reflect.set(node.node, 'foo', 'foo');
        });
        it('set works', () => {
            expect(defined).toBe(true);
        });
        it('get works', () => {
            expect(Reflect.get(node.node, 'foo')).toBe('foo');
            expect(Reflect.get(raw, 'foo')).toBeUndefined();
        });
        it('getOwnPropertyDescriptor works', () => {
            expect(Reflect.getOwnPropertyDescriptor(node.node, 'foo')).toEqual({
                value: 'foo',
                enumerable: true,
                writable: true,
                configurable: true,
            });
            expect(Reflect.getOwnPropertyDescriptor(raw, 'foo')).toBeUndefined();
        });
        it('has works', () => {
            expect(Reflect.has(node.node, 'foo')).toBe(true);
            expect(Reflect.has(raw, 'foo')).toBe(false);
        });
        it('deleteProperty works', () => {
            Reflect.deleteProperty(node.node, 'foo');
            expect(Reflect.has(node.node, 'foo')).toBe(false);
        });
        it('ownKeys works', () => {
            expect(Reflect.ownKeys(node.node).includes('foo')).toBe(true);
            expect(Reflect.ownKeys(raw).includes('foo')).toBe(false);
        });
        it('defineProperty works', () => {
            Reflect.defineProperty(node.node, 'foo', {
                value: 'bar',
            });
            expect(Reflect.get(node.node, 'foo')).toBe('bar');
        });
    });

    describe('new configurable property defined ', () => {
        let raw: Plain;
        let node: NodeProxy<Plain>;
        let defined = false;
        beforeEach(() => {
            [raw, node] = ready();
            defined = Reflect.defineProperty(node.node, 'foo', {
                value: 'foo',
                enumerable: true,
                writable: true,
                configurable: true,
            });
        });
        it('defineProperty works', () => {
            expect(defined).toBe(true);
        });
        it('get works', () => {
            expect(Reflect.get(node.node, 'foo')).toBe('foo');
            expect(Reflect.get(raw, 'foo')).toBeUndefined();
        });
        it('getOwnPropertyDescriptor works', () => {
            expect(Reflect.getOwnPropertyDescriptor(node.node, 'foo')).toEqual({
                value: 'foo',
                enumerable: true,
                writable: true,
                configurable: true,
            });
            expect(Reflect.getOwnPropertyDescriptor(raw, 'foo')).toBeUndefined();
        });
        it('has works', () => {
            expect(Reflect.has(node.node, 'foo')).toBe(true);
            expect(Reflect.has(raw, 'foo')).toBe(false);
        });
        it('deleteProperty works', () => {
            Reflect.deleteProperty(node.node, 'foo');
            expect(Reflect.has(node.node, 'foo')).toBe(false);
        });
        it('ownKeys works', () => {
            expect(Reflect.ownKeys(node.node).includes('foo')).toBe(true);
            expect(Reflect.ownKeys(raw).includes('foo')).toBe(false);
        });
        it('set works', () => {
            node.node.foo = 'bar';
            expect(Reflect.get(node.node, 'foo')).toBe('bar');
        });
    });

    describe('new non-configurable and writable property defined ', () => {
        let raw: Plain;
        let node: NodeProxy<Plain>;
        let defined = false;
        beforeEach(() => {
            [raw, node] = ready();
            defined = Reflect.defineProperty(node.node, 'foo', {
                value: 'foo',
                enumerable: true,
                writable: true,
                configurable: false,
            });
        });
        it('defineProperty works', () => {
            expect(defined).toBe(true);
        });
        it('get works', () => {
            expect(Reflect.get(node.node, 'foo')).toBe('foo');
            expect(Reflect.get(raw, 'foo')).toBeUndefined();
        });
        it('getOwnPropertyDescriptor works', () => {
            expect(Reflect.getOwnPropertyDescriptor(node.node, 'foo')).toEqual({
                value: 'foo',
                enumerable: true,
                writable: true,
                configurable: false,
            });
            expect(Reflect.getOwnPropertyDescriptor(raw, 'foo')).toBeUndefined();
        });
        it('has works', () => {
            expect(Reflect.has(node.node, 'foo')).toBe(true);
            expect(Reflect.has(raw, 'foo')).toBe(false);
        });
        // cannot delete
        it('deleteProperty works', () => {
            Reflect.deleteProperty(node.node, 'foo');
            expect(Reflect.has(node.node, 'foo')).toBe(true);
        });
        it('ownKeys works', () => {
            expect(Reflect.ownKeys(node.node).includes('foo')).toBe(true);
            expect(Reflect.ownKeys(raw).includes('foo')).toBe(false);
        });
        it('set works', () => {
            Reflect.set(node.node, 'foo', 'bar');
            expect(Reflect.get(node.node, 'foo')).toBe('bar');
        });
    });

    describe('new non-configurable and non-writable property defined ', () => {
        let raw: Plain;
        let node: NodeProxy<Plain>;
        let defined = false;
        beforeEach(() => {
            [raw, node] = ready();
            defined = Reflect.defineProperty(node.node, 'foo', {
                value: 'foo',
                enumerable: true,
                writable: false,
                configurable: false,
            });
        });
        it('defineProperty works', () => {
            expect(defined).toBe(true);
        });
        it('get works', () => {
            expect(Reflect.get(node.node, 'foo')).toBe('foo');
            expect(Reflect.get(raw, 'foo')).toBeUndefined();
        });
        it('getOwnPropertyDescriptor works', () => {
            expect(Reflect.getOwnPropertyDescriptor(node.node, 'foo')).toEqual({
                value: 'foo',
                enumerable: true,
                writable: false,
                configurable: false,
            });
            expect(Reflect.getOwnPropertyDescriptor(raw, 'foo')).toBeUndefined();
        });
        it('has works', () => {
            expect(Reflect.has(node.node, 'foo')).toBe(true);
            expect(Reflect.has(raw, 'foo')).toBe(false);
        });
        it('deleteProperty works', () => {
            // cannot delete
            Reflect.deleteProperty(node.node, 'foo');
            expect(Reflect.has(node.node, 'foo')).toBe(true);
        });
        it('ownKeys works', () => {
            expect(Reflect.ownKeys(node.node).includes('foo')).toBe(true);
            expect(Reflect.ownKeys(raw).includes('foo')).toBe(false);
        });
        it('set works', () => {
            Reflect.set(node.node, 'foo', 'bar');
            expect(Reflect.get(node.node, 'foo')).toBe('foo');
        });
    });

    describe('escaped new', () => {
        let raw: Plain;
        let node: NodeProxy<Plain>;
        beforeEach(() => {
            [raw, node] = ready();
        });
        it('set/get a new escaped variable', async () => {
            node.node.bar = 'bar';
            expect(node.node.bar).toBe('bar');
            expect(raw.bar).toBe('bar');
        });

        it('defineProperty/get a new escaped variable', async () => {
            Reflect.defineProperty(node.node, 'bar', {
                value: 'bar',
                configurable: true,
            });
            expect(node.node.bar).toBe('bar');
            expect(raw.bar).toBe('bar');
        });

        it('getOwnPropertyDescriptor a new escaped variable', async () => {
            node.node.bar = 'bar';
            expect(Reflect.getOwnPropertyDescriptor(node.node, 'bar')).toEqual(
                Reflect.getOwnPropertyDescriptor(raw, 'bar')
            );
        });

        it('has a new escaped variable', async () => {
            node.node.bar = 'bar';
            expect(Reflect.has(node.node, 'bar')).toBe(true);
            expect(Reflect.has(raw, 'bar')).toBe(true);
        });

        it('delete a new escaped variable', async () => {
            node.node.bar = 'bar';
            Reflect.deleteProperty(node.node, 'bar');
            expect(Reflect.has(node.node, 'bar')).toBe(false);
            expect(Reflect.has(raw, 'bar')).toBe(false);
        });

        it.todo('ownKeys respect escaped variable');
    });
});

// shadow is always configurable
describe('(configurable) property comes from shadow', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'shadowValueVar', {
            value: 'x-shadowValueVar',
            configurable: true,
        });

        expect(node.node.shadowValueVar).toBe('x-shadowValueVar');
        expect(Reflect.has(raw, 'shadowValueVar')).toBe(false);
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'shadowValueVar', {
            value: 'x-shadowValueVar',
            configurable: false,
        });

        expect(node.node.shadowValueVar).toBe('x-shadowValueVar');
        expect(Reflect.has(raw, 'shadowValueVar')).toBe(false);
    });
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'shadowValueVar');

        expect(Reflect.has(node.node, 'shadowValueVar')).toBe(false);
        // does not delete from shadow
        expect(Reflect.has(node.shadow, 'shadowValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(Reflect.get(node.node, 'shadowValueVar')).toBe('shadowValueVar');
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'shadowValueVar')).toBeDefined();
    });
    it('has works', () => {
        expect(Reflect.has(node.node, 'shadowValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('shadowValueVar')).toBe(true);
    });
    it('set works', () => {
        node.node.shadowValueVar = 'x-shadowValueVar';

        expect(node.node.shadowValueVar).toBe('x-shadowValueVar');
        expect(Reflect.has(raw, 'shadowValueVar')).toBe(false);
    });
});

describe('configurable property comes from prototype', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'protoConfigurableValueVar', {
            value: 'x-protoConfigurableValueVar',
            configurable: true,
        });

        expect(node.node.protoConfigurableValueVar).toBe('x-protoConfigurableValueVar');
        expect(raw.protoConfigurableValueVar).toBe('protoConfigurableValueVar');
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'protoConfigurableValueVar', {
            value: 'x-protoConfigurableValueVar',
            configurable: false,
        });

        expect(node.node.protoConfigurableValueVar).toBe('x-protoConfigurableValueVar');
        expect(raw.protoConfigurableValueVar).toBe('protoConfigurableValueVar');
    });
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'protoConfigurableValueVar');

        expect(Reflect.has(node.node, 'protoConfigurableValueVar')).toBe(false);
        expect(Reflect.has(raw, 'protoConfigurableValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(Reflect.get(node.node, 'protoConfigurableValueVar')).toBe('protoConfigurableValueVar');
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'protoConfigurableValueVar')).toBeUndefined();
    });
    it('has works', () => {
        expect(Reflect.has(node.node, 'protoConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('protoConfigurableValueVar')).toBe(false);
    });
    it('set works', () => {
        node.node.protoConfigurableValueVar = 'x-protoConfigurableValueVar';

        expect(node.node.protoConfigurableValueVar).toBe('x-protoConfigurableValueVar');
        expect(raw.protoConfigurableValueVar).toBe('protoConfigurableValueVar');
    });
});

describe('non-configurable property comes from prototype ', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'protoNonConfigurableValueVar', {
            value: 'x-protoNonConfigurableValueVar',
            configurable: true,
        });

        expect(node.node.protoNonConfigurableValueVar).toBe('x-protoNonConfigurableValueVar');
        expect(raw.protoNonConfigurableValueVar).toBe('protoNonConfigurableValueVar');
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'protoNonConfigurableValueVar', {
            value: 'x-protoNonConfigurableValueVar',
            configurable: false,
        });

        expect(node.node.protoNonConfigurableValueVar).toBe('x-protoNonConfigurableValueVar');
        expect(raw.protoNonConfigurableValueVar).toBe('protoNonConfigurableValueVar');
    });
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'protoNonConfigurableValueVar');

        expect(Reflect.has(node.node, 'protoNonConfigurableValueVar')).toBe(false);
        expect(Reflect.has(raw, 'protoNonConfigurableValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(Reflect.get(node.node, 'protoNonConfigurableValueVar')).toBe('protoNonConfigurableValueVar');
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'protoNonConfigurableValueVar')).toBeUndefined();
    });
    it('has works', () => {
        expect(Reflect.has(node.node, 'protoNonConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('protoNonConfigurableValueVar')).toBe(false);
    });
    it('set works', () => {
        node.node.protoNonConfigurableValueVar = 'x-protoNonConfigurableValueVar';

        expect(node.node.protoNonConfigurableValueVar).toBe('x-protoNonConfigurableValueVar');
        expect(raw.protoNonConfigurableValueVar).toBe('protoNonConfigurableValueVar');
    });
});

describe('escaped configurable property comes from prototype', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'protoEscapedConfigurableValueVar', {
            value: 'x-protoEscapedConfigurableValueVar',
            configurable: true,
        });
        expect(node.node.protoEscapedConfigurableValueVar).toBe('x-protoEscapedConfigurableValueVar');
        expect(raw.protoEscapedConfigurableValueVar).toBe('x-protoEscapedConfigurableValueVar');
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'protoEscapedConfigurableValueVar', {
            value: 'x-protoEscapedConfigurableValueVar',
            configurable: false,
        });
        expect(node.node.protoEscapedConfigurableValueVar).toBe('x-protoEscapedConfigurableValueVar');
        expect(raw.protoEscapedConfigurableValueVar).toBe('x-protoEscapedConfigurableValueVar');
    });
    // prototype has nothing to do with "deleteProperty"
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'protoEscapedConfigurableValueVar');
        expect(Reflect.has(node.node, 'protoEscapedConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'protoEscapedConfigurableValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(node.node.protoEscapedConfigurableValueVar).toBe('protoEscapedConfigurableValueVar');
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'protoEscapedConfigurableValueVar')).toEqual(
            Reflect.getOwnPropertyDescriptor(raw, 'protoEscapedConfigurableValueVar')
        );
    });
    // escaped has nothing to do with "has"
    it('has works', () => {
        expect(Reflect.has(node.node, 'protoEscapedConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'protoEscapedConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('protoEscapedConfigurableValueVar')).toBe(false);
    });
    it('set works', () => {
        node.node.protoEscapedConfigurableValueVar = 'x-protoEscapedConfigurableValueVar';
        expect(node.node.protoEscapedConfigurableValueVar).toBe('x-protoEscapedConfigurableValueVar');
        expect(raw.protoEscapedConfigurableValueVar).toBe('x-protoEscapedConfigurableValueVar');
    });
});

describe('escaped non-configurable comes from prototype', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'protoEscapedNonConfigurableValueVar', {
            value: 'x-protoEscapedNonConfigurableValueVar',
            configurable: true,
        });
        expect(node.node.protoEscapedNonConfigurableValueVar).toBe('x-protoEscapedNonConfigurableValueVar');
        expect(raw.protoEscapedNonConfigurableValueVar).toBe('x-protoEscapedNonConfigurableValueVar');
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'protoEscapedNonConfigurableValueVar', {
            value: 'x-protoEscapedNonConfigurableValueVar',
            configurable: false,
        });
        expect(node.node.protoEscapedNonConfigurableValueVar).toBe('x-protoEscapedNonConfigurableValueVar');
        expect(raw.protoEscapedNonConfigurableValueVar).toBe('x-protoEscapedNonConfigurableValueVar');
    });
    // prototype has nothing to do with "deleteProperty"
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'protoEscapedNonConfigurableValueVar');
        expect(Reflect.has(node.node, 'protoEscapedNonConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'protoEscapedNonConfigurableValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(node.node.protoEscapedNonConfigurableValueVar).toBe('protoEscapedNonConfigurableValueVar');
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'protoEscapedNonConfigurableValueVar')).toEqual(
            Reflect.getOwnPropertyDescriptor(raw, 'protoEscapedNonConfigurableValueVar')
        );
    });
    // prototype has nothing to do with "has"
    it('has works', () => {
        expect(Reflect.has(node.node, 'protoEscapedNonConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'protoEscapedNonConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('protoEscapedNonConfigurableValueVar')).toBe(false);
    });
    it('set works', () => {
        node.node.protoEscapedNonConfigurableValueVar = 'x-protoEscapedNonConfigurableValueVar';
        expect(node.node.protoEscapedNonConfigurableValueVar).toBe('x-protoEscapedNonConfigurableValueVar');
        expect(raw.protoEscapedNonConfigurableValueVar).toBe('x-protoEscapedNonConfigurableValueVar');
    });
});

describe('configurable property comes from raw', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'rawConfigurableValueVar', {
            value: 'x-rawConfigurableValueVar',
            configurable: true,
        });

        expect(node.node.rawConfigurableValueVar).toBe('x-rawConfigurableValueVar');
        expect(raw.rawConfigurableValueVar).toBe('rawConfigurableValueVar');
    });
    // A property cannot be non-configurable, unless there exists a corresponding non-configurable own property of the target object.
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'rawConfigurableValueVar', {
            value: 'x-rawConfigurableValueVar',
            configurable: true,
        });

        expect(node.node.rawConfigurableValueVar).toBe('x-rawConfigurableValueVar');
        expect(raw.rawConfigurableValueVar).toBe('rawConfigurableValueVar');
    });
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'rawConfigurableValueVar');

        expect(Reflect.has(node.node, 'rawConfigurableValueVar')).toBe(false);
        expect(Reflect.has(raw, 'rawConfigurableValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(Reflect.get(node.node, 'rawConfigurableValueVar')).toBe('rawConfigurableValueVar');
    });
    // The value reported for a property must be undefined if the corresponding target object property is a non-configurable own accessor property that has undefined as its [[Get]] attribute.
    it('get works if non-configurable and has no [[Get]]', () => {
        Reflect.defineProperty(node.node, 'rawConfigurableValueVar', {
            set: function () {},
            configurable: false,
        });
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawConfigurableValueVar')?.set).toBeDefined();
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawConfigurableValueVar')?.get).toBeUndefined();
        expect(Reflect.get(node.node, 'rawConfigurableValueVar')).toBeUndefined();
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawConfigurableValueVar')).toEqual(
            Reflect.getOwnPropertyDescriptor(raw, 'rawConfigurableValueVar')
        );
    });
    it('has works', () => {
        expect(Reflect.has(node.node, 'rawConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('rawConfigurableValueVar')).toBe(true);
    });
    it('set works', () => {
        node.node.rawConfigurableValueVar = 'x-rawConfigurableValueVar';

        expect(node.node.rawConfigurableValueVar).toBe('x-rawConfigurableValueVar');
        expect(raw.rawConfigurableValueVar).toBe('rawConfigurableValueVar');
    });
});

describe('non-configurable property comes from raw', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'rawNonConfigurableValueVar', {
            value: 'x-rawNonConfigurableValueVar',
            configurable: true,
        });
        // cannot configure
        expect(node.node.rawNonConfigurableValueVar).toBe('rawNonConfigurableValueVar');
        expect(raw.rawNonConfigurableValueVar).toBe('rawNonConfigurableValueVar');
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'rawNonConfigurableValueVar', {
            value: 'x-rawNonConfigurableValueVar',
            configurable: false,
        });
        // can write
        expect(node.node.rawNonConfigurableValueVar).toBe('x-rawNonConfigurableValueVar');
        expect(raw.rawNonConfigurableValueVar).toBe('rawNonConfigurableValueVar');
    });
    // A non-configurable property cannot be non-writable, unless there exists a corresponding non-configurable, non-writable own property of the target object.
    it('defineProperty with non-writable works', () => {
        expect(
            Reflect.defineProperty(node.node, 'rawNonConfigurableValueVar', {
                value: 'x-rawNonConfigurableValueVar',
                writable: false,
            })
        ).toBe(true);
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawNonConfigurableValueVar')?.writable).toBe(false);
    });
    // A property cannot be reported as deleted, if it exists as a non-configurable own property of the target object.
    it('deleteProperty works', () => {
        expect(Reflect.deleteProperty(node.node, 'rawNonConfigurableValueVar')).toBe(false);
        // Cannot delete
        expect(Reflect.has(node.node, 'rawNonConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'rawNonConfigurableValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(Reflect.get(node.node, 'rawNonConfigurableValueVar')).toBe('rawNonConfigurableValueVar');
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawNonConfigurableValueVar')).toEqual(
            Reflect.getOwnPropertyDescriptor(raw, 'rawNonConfigurableValueVar')
        );
    });
    it('has works', () => {
        expect(Reflect.has(node.node, 'rawNonConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('rawNonConfigurableValueVar')).toBe(true);
    });
    it('set works', () => {
        node.node.rawNonConfigurableValueVar = 'x-rawNonConfigurableValueVar';

        expect(node.node.rawNonConfigurableValueVar).toBe('x-rawNonConfigurableValueVar');
        expect(raw.rawNonConfigurableValueVar).toBe('rawNonConfigurableValueVar');
    });
});

describe('escaped configurable comes raw', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'rawEscapedConfigurableValueVar', {
            value: 'x-rawEscapedConfigurableValueVar',
            configurable: true,
        });
        expect(node.node.rawEscapedConfigurableValueVar).toBe('x-rawEscapedConfigurableValueVar');
        expect(raw.rawEscapedConfigurableValueVar).toBe('x-rawEscapedConfigurableValueVar');
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'rawEscapedConfigurableValueVar', {
            value: 'x-rawEscapedConfigurableValueVar',
            configurable: false,
        });
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawEscapedConfigurableValueVar')?.configurable).toBe(false);
        expect(node.node.rawEscapedConfigurableValueVar).toBe('x-rawEscapedConfigurableValueVar');
        expect(raw.rawEscapedConfigurableValueVar).toBe('x-rawEscapedConfigurableValueVar');
    });
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'rawEscapedConfigurableValueVar');
        expect(Reflect.has(node.node, 'rawEscapedConfigurableValueVar')).toBe(false);
        expect(Reflect.has(raw, 'rawEscapedConfigurableValueVar')).toBe(false);
    });
    it('get works', () => {
        expect(Reflect.get(node.node, 'rawEscapedConfigurableValueVar')).toStrictEqual(
            'rawEscapedConfigurableValueVar'
        );
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawEscapedConfigurableValueVar')).toEqual(
            Reflect.getOwnPropertyDescriptor(raw, 'rawEscapedConfigurableValueVar')
        );
    });
    it('has works', () => {
        expect(Reflect.has(node.node, 'rawEscapedConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'rawEscapedConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('rawEscapedConfigurableValueVar')).toBe(true);
    });
    it('set works', () => {
        node.node.rawEscapedConfigurableValueVar = 'x-rawEscapedConfigurableValueVar';
        expect(node.node.rawEscapedConfigurableValueVar).toBe('x-rawEscapedConfigurableValueVar');
        expect(raw.rawEscapedConfigurableValueVar).toBe('x-rawEscapedConfigurableValueVar');
    });
});

describe('escaped non-configurable property comes from raw', () => {
    let raw: Plain;
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [raw, node] = ready();
    });
    it('defineProperty with configurable works', () => {
        Reflect.defineProperty(node.node, 'rawEscapedNonConfigurableValueVar', {
            value: 'x-rawEscapedNonConfigurableValueVar',
            configurable: true,
        });
        // Cannot re-configure
        expect(node.node.rawEscapedNonConfigurableValueVar).toBe('rawEscapedNonConfigurableValueVar');
        expect(raw.rawEscapedNonConfigurableValueVar).toBe('rawEscapedNonConfigurableValueVar');
    });
    it('defineProperty with non-configurable works', () => {
        Reflect.defineProperty(node.node, 'rawEscapedNonConfigurableValueVar', {
            value: 'x-rawEscapedNonConfigurableValueVar',
            configurable: false,
        });
        // can write
        expect(node.node.rawEscapedNonConfigurableValueVar).toBe('x-rawEscapedNonConfigurableValueVar');
        expect(raw.rawEscapedNonConfigurableValueVar).toBe('x-rawEscapedNonConfigurableValueVar');
    });
    it('deleteProperty works', () => {
        Reflect.deleteProperty(node.node, 'rawEscapedNonConfigurableValueVar');
        expect(Reflect.has(node.node, 'rawEscapedNonConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'rawEscapedNonConfigurableValueVar')).toBe(true);
    });
    it('get works', () => {
        expect(Reflect.get(node.node, 'rawEscapedNonConfigurableValueVar')).toStrictEqual(
            'rawEscapedNonConfigurableValueVar'
        );
    });
    it('getOwnPropertyDescriptor works', () => {
        expect(Reflect.getOwnPropertyDescriptor(node.node, 'rawEscapedNonConfigurableValueVar')).toEqual(
            Reflect.getOwnPropertyDescriptor(raw, 'rawEscapedNonConfigurableValueVar')
        );
    });
    it('has works', () => {
        expect(Reflect.has(node.node, 'rawEscapedNonConfigurableValueVar')).toBe(true);
        expect(Reflect.has(raw, 'rawEscapedNonConfigurableValueVar')).toBe(true);
    });
    it('ownKeys works', () => {
        expect(Reflect.ownKeys(node.node).includes('rawEscapedNonConfigurableValueVar')).toBe(true);
    });
    it('set works', () => {
        node.node.rawEscapedNonConfigurableValueVar = 'x-rawEscapedNonConfigurableValueVar';
        expect(node.node.rawEscapedNonConfigurableValueVar).toBe('x-rawEscapedNonConfigurableValueVar');
        expect(raw.rawEscapedNonConfigurableValueVar).toBe('x-rawEscapedNonConfigurableValueVar');
    });
});

describe('read functions', () => {
    class Cat {}
    const raw = Object.create(window, {
        say: {
            value: function (): unknown {
                if (this !== raw) {
                    throw TypeError('Illegal invocation');
                }

                return 'ret';
            },
        },
        getOwner: {
            value: function (): unknown {
                return this;
            },
        },
        Cat: {
            value: Cat,
        },
    });

    class PlainNode extends NodeProxy<typeof raw> {
        protected get debugName(): string {
            return 'test:plain';
        }

        protected getBuiltInShadow(): Record<string, unknown> {
            return {};
        }

        protected beforeDefineProperty(): void {}
        protected afterDefineProperty(): void {}
        protected beforeDeleteProperty(): void {}
        protected afterDeleteProperty(): void {}
        protected beforeSet(): void {}
        protected afterSet(): void {}
        public onDestroy(): void {}
        public onLoad(): void {}
        public onLoading(): void {}
    }

    const node = new PlainNode('test', raw, {});

    it('context respected', () => {
        expect(node.node.say()).toBe('ret');
    });

    it('context of descendant respected', () => {
        const descendant = Object.create(node.node);
        expect(descendant.getOwner()).toBe(raw);
    });

    it('constructor respected', () => {
        expect(() => new node.node.Cat()).not.toThrow();
    });
});

describe.skip('getPrototypeOf', () => {
    // let raw: Plain;
    // let node: NodeProxy<Plain>;
    // ready();
    // beforeEach(() => {
    //     [raw, node] = ready();
    // });
});

describe('ownKeys', () => {
    let node: NodeProxy<Plain>;
    beforeEach(() => {
        [, node] = ready();
    });

    it('ownKeys affected by set/delete', () => {
        node.node.s = 1;
        node.node.a = 2;
        node.node.b = 2;
        node.node['9'] = 2;
        node.node['8'] = 2;
        expect(Reflect.ownKeys(node.node)).toEqual(
            expect.arrayContaining([
                '8',
                '9',
                'rawConfigurableValueVar',
                'rawNonConfigurableValueVar',
                'rawEscapedConfigurableValueVar',
                'rawEscapedNonConfigurableValueVar',
                'shadowValueVar',
                's',
                'a',
                'b',
            ])
        );
        delete node.node.s;
        expect(Reflect.ownKeys(node.node)).toEqual(
            expect.arrayContaining([
                '8',
                '9',
                'rawConfigurableValueVar',
                'rawNonConfigurableValueVar',
                'rawEscapedConfigurableValueVar',
                'rawEscapedNonConfigurableValueVar',
                'shadowValueVar',
                'a',
                'b',
            ])
        );
        node.node.s = 0;
        node.node['80'] = 0;
        expect(Reflect.ownKeys(node.node)).toEqual(
            expect.arrayContaining([
                '8',
                '80',
                '9',
                'rawConfigurableValueVar',
                'rawNonConfigurableValueVar',
                'rawEscapedConfigurableValueVar',
                'rawEscapedNonConfigurableValueVar',
                'shadowValueVar',
                'a',
                'b',
                's',
            ])
        );
    });
});
