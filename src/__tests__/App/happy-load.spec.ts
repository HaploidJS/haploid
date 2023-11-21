import { ScriptNode } from '@/node';
import { toArray } from '@/utils/toArray';
import { delay } from '../../../spec/test-utils';
import { createApp } from './utils';
import { App } from '@/App';
import { LifecycleFns } from '@/Def';

describe.only(`happy-load`, () => {
    it('load calls resolveAssets and resolveEnvVariables', async () => {
        const app = createApp();
        const fn = jest.fn();

        app.hooks.resolveAssets.tap('test', () => {
            fn('resolveAssets');
            return {
                styles: [],
                scripts: [new ScriptNode({ content: `module.exports={mount(){return 365;},unmount(){}}` })],
            };
        });

        app.hooks.resolveEnvVariables.tap('test', () => {
            fn('resolveEnvVariables');
            return {
                dev: true,
            };
        });

        const lf = await app.load();

        const mounts = toArray(lf.mount);

        expect(mounts[0]({ name: app.name })).toBe(365);

        expect(fn).toHaveBeenNthCalledWith(1, 'resolveAssets');
        expect(fn).toHaveBeenNthCalledWith(2, 'resolveEnvVariables');
    });
    it('load from options.lifecycle', async () => {
        const lifecycle = {
            mount: jest.fn(),
            unmount: jest.fn(),
        };
        const app = new App<Record<never, never>, Record<never, never>>({
            name: 'foo',
            lifecycle,
        });
        await expect(app.load()).resolves.toStrictEqual(lifecycle);
    });
    it('load from cache', async () => {
        const app = new App<Record<never, never>, Record<never, never>>({
            name: 'foo',
            lifecycle: (): Promise<LifecycleFns<Record<never, never>>> =>
                delay(600).then(() => ({
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })),
        });

        await app.load();
        const start = Date.now();
        await app.load();
        // From cache is very fast.
        expect(Date.now() - start).toBeLessThanOrEqual(20);
    });

    it('load in sequence', async () => {
        const app = new App<Record<never, never>, Record<never, never>>({
            name: 'foo',
            lifecycle: (): Promise<LifecycleFns<Record<never, never>>> =>
                delay(500).then(() => ({
                    mount: jest.fn(),
                    unmount: jest.fn(),
                })),
        });

        app.load();
        await delay(300);
        const start = Date.now();
        await app.load();
        expect(Date.now() - start).toBeLessThanOrEqual(300);
    });
});
