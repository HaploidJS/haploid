import { App } from '@/App';

describe.only(`load-rejects`, () => {
    it(`load() rejected when resolveAssets throws`, async () => {
        const app = new App({
            name: 'foo',
        });

        app.hooks.resolveAssets.tap('test', () => {
            throw Error('fake');
        });

        await expect(app.load()).rejects.toThrow(/fake/);
    });

    it(`load() rejected when resolveEnvVariables throws`, async () => {
        const app = new App({
            name: 'foo',
        });

        app.hooks.resolveAssets.tap('test', () => {
            return {
                scripts: [],
                styles: [],
            };
        });

        app.hooks.resolveEnvVariables.tap('test', () => {
            throw Error('fake');
        });

        await expect(app.load()).rejects.toThrow(/fake/);
    });

    it(`load() rejected when no options.lifecycle`, async () => {
        const app = new App({
            name: 'foo',
        });

        await expect(app.load()).rejects.toThrow(/No lifecycle/);
    });
});
