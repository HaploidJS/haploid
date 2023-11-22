import { LocalStorageNode } from '../LocalStorage';

describe.only('LocalStorage', () => {
    let ls: LocalStorageNode;

    beforeEach(() => {
        ls = new LocalStorageNode('test');
    });

    afterEach(() => {
        ls.node.clear();
        ls.onDestroy();
    });

    it('node is an instance of Storage', () => {
        expect(ls.node.constructor).toStrictEqual(Storage);
        expect(ls.node).toBeInstanceOf(Storage);
    });

    it('setItem/getItem/removeItem/length/key', () => {
        expect(ls.node.length).toBe<number>(0);
        ls.node.setItem('1', '1');
        expect(ls.node.length).toBe<number>(1);
        ls.node.setItem('2', '2');
        expect(ls.node.length).toBe<number>(2);
        expect(ls.node.key(0)).toBe<string>('1');
        expect(ls.node.key(1)).toBe<string>('2');
        expect(ls.node.getItem('1')).toBe<string>('1');
        expect(ls.node.getItem('2')).toBe<string>('2');
        ls.node.removeItem('1');
        expect(ls.node.getItem('1')).toBeNull();
        expect(ls.node.length).toBe<number>(1);
        expect(ls.node.key(0)).toBe<string>('2');

        ls.node.setItem('3', '3');

        ls.node.clear();

        expect(ls.node.length).toBe<number>(0);
    });
});
