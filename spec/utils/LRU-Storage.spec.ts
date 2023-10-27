import { LRUStorage } from '@/utils/LRU-Storage';
import { delay } from '../test-utils';

describe.only('LRU-Storage', () => {
    it('expire', async () => {
        const lru = new LRUStorage({
            expire: 500,
        });

        lru.touch('a');
        await delay(200);
        lru.touch('b');
        await delay(400);
        const cache = lru.getCollection();
        expect(cache).toHaveLength(1);
        expect(cache).toEqual(expect.arrayContaining(['b']));
    });

    it('max', async () => {
        const onExceed = jest.fn();
        const lru = new LRUStorage({
            max: 1,
            expire: 100,
            onExceed,
        });

        lru.touch('a');
        await delay(50);
        lru.touch('a');
        await delay(0);
        lru.touch('b');
        const cache = lru.getCollection();
        expect(cache).toHaveLength(2);
        expect(cache).toEqual(expect.arrayContaining(['b', 'a']));
        lru.touch('b');
        expect(onExceed).toHaveBeenCalledTimes(2);
    });

    it('top', async () => {
        const lru = new LRUStorage({
            top: 3,
            expire: 100,
        });

        lru.touch('a');
        await delay(10);
        lru.touch('b');
        await delay(10);
        lru.touch('c');
        await delay(10);
        lru.touch('d');

        const cache = lru.getCollection();
        expect(cache).toHaveLength(3);
        expect(cache).toEqual(expect.arrayContaining(['d', 'c', 'b']));
    });
});
