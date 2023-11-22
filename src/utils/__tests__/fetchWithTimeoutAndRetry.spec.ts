import { fetchWithTimeoutAndRetry } from '../../utils/fetchWithTimeoutAndRetry';

describe.only('fetchWithTimeoutAndRetry', () => {
    it('success after retry times', async () => {
        const retries = 2;
        const src = `//localhost:10810/fetchWithTimeoutAndRetry/retries.js?retry=${retries}`;
        await expect(fetchWithTimeoutAndRetry(src, {}, 4000, retries)).resolves.toBeDefined();
    });

    it('still failed if retry times out', async () => {
        const retries = 2;
        const src = `//localhost:10810/fetchWithTimeoutAndRetry/retries-out.js?retry=${retries}`;
        await expect(fetchWithTimeoutAndRetry(src, {}, 1000, retries - 1)).rejects.toThrowError();
    });

    it('timeout', async () => {
        const timeout = 500;
        const src = `//localhost:10810/fetchWithTimeoutAndRetry/retries-out.js?delay=${timeout}`;
        await expect(fetchWithTimeoutAndRetry(src, {}, timeout)).rejects.toThrow(/exceeds 500ms/);
    });
});
