import { ManualContainer } from '@/index';

describe.only(`happy-dev`, () => {
    const devTool = window.__HAPLOID_DEV_TOOL__;

    it(`toString.call()`, async () => {
        expect({}.toString.call(devTool)).toBe('[object DevTool]');
    });

    it(`containers update`, async () => {
        const createdPromise = new Promise<void>(resolve => {
            devTool.on('containercreated', () => {
                resolve();
            });
        });

        const removedPromise = new Promise<void>(resolve => {
            devTool.on('containerremoved', () => {
                resolve();
            });
        });

        const container = new ManualContainer({ name: 'root', root: '#app' });

        await Promise.resolve(createdPromise);

        // collection updated
        expect(Array.from(devTool.containers)).toHaveLength(1);

        await container.destroy();

        await Promise.resolve(removedPromise);

        expect(Array.from(devTool.containers)).toHaveLength(0);
    });
});
