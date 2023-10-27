import { getUniversalDownloader } from '@/Downloader';
import { delay } from '../test-utils';

describe.only('download', () => {
    it('share fetching process if src equals', async () => {
        const src = '//localhost:10810/downloader/share.js?delay=200';
        getUniversalDownloader().download(src);
        await delay(100);
        const start = Date.now();
        await getUniversalDownloader().download(src);
        expect(Date.now() - start).toBeLessThanOrEqual(200);
    });

    it('from cache', async () => {
        const src = '//localhost:10810/downloader/cache.js';
        const js = await getUniversalDownloader().download(src);
        const start = Date.now();
        await expect(getUniversalDownloader().download(src)).resolves.toBe(js);
        // From cache is very fast
        expect(Date.now() - start).toBeLessThan(20);
    });

    it('timeout works', async () => {
        const src = '//localhost:10810/downloader/timeout.js?delay=500&content=a';
        await expect(getUniversalDownloader().download(src, {}, 200)).rejects.toThrow(/timeout/);
    });
});
