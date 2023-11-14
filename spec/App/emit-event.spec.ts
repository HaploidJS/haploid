import { LifecycleFns } from '@/Def';
import { createApp } from './utils';
import { App } from '@/App';

describe.only(`emit-event`, () => {
    it('emit statechange', async () => {
        const app = createApp();
        const fn = jest.fn();
        const onceFn = jest.fn();
        app.on('statechange', fn);
        app.once('statechange', onceFn);
        await app.start();
        // NOT_LOADED =>LOADING_SOURCE_CODE=>NOT_BOOTSTRAPPED=>BOOTSTRAPPING=>NOT_MOUNTED=>MOUNTING=>MOUNTED
        expect(fn).toHaveBeenCalledTimes(6);
        expect(onceFn).toHaveBeenCalledTimes(1);
        app.off('statechange', fn);
        await app.stop();
        expect(fn).toHaveBeenCalledTimes(6); // still
    });

    it(`emit beforeload/afterload`, async () => {
        const app = createApp();
        const beforeload = jest.fn();
        const afterload = jest.fn();
        app.on('beforeload', beforeload);
        app.on('afterload', afterload);
        await app.load().catch(e => e);
        expect(beforeload).toHaveBeenCalledTimes(1);
        expect(afterload).toHaveBeenCalledTimes(1);
    });

    it(`emit beforeload/loaderror`, async () => {
        const app = new App<Record<never, never>>({
            name: 'foo',
            lifecycle: (): Promise<LifecycleFns<unknown>> => Promise.reject(Error('mock error')),
        });
        const beforeload = jest.fn();
        const loaderror = jest.fn();
        app.on('beforeload', beforeload);
        app.on('loaderror', loaderror);
        await app.load().catch(e => e);
        expect(beforeload).toHaveBeenCalledTimes(1);
        expect(loaderror).toHaveBeenCalledTimes(1);
    });

    it(`emit beforestart/afterstart`, async () => {
        const app = createApp();
        const beforestart = jest.fn();
        const afterstart = jest.fn();
        app.on('beforestart', beforestart).on('afterstart', afterstart);
        await app.start();

        expect(beforestart).toHaveBeenCalledTimes(1);
        expect(afterstart).toHaveBeenCalledTimes(1);
    });

    it(`emit beforestart/starterror`, async () => {
        const app = createApp({
            bootstrap: () => Promise.reject(Error('mock error')),
        });
        const beforestart = jest.fn();
        const starterror = jest.fn();
        app.on('beforestart', beforestart).on('starterror', starterror);
        await expect(app.start()).rejects.toThrow();

        expect(beforestart).toHaveBeenCalledTimes(1);
        expect(starterror).toHaveBeenCalledTimes(1);
    });

    it(`emit beforestop/afterstop`, async () => {
        const app = createApp();
        const beforestop = jest.fn();
        const afterstop = jest.fn();
        app.on('beforestop', beforestop).on('afterstop', afterstop);
        await app.start();
        await app.stop();

        expect(beforestop).toHaveBeenCalledTimes(1);
        expect(afterstop).toHaveBeenCalledTimes(1);
    });

    it(`emit beforestop/stoperror`, async () => {
        const app = createApp({
            unmount: () => Promise.reject(Error('mock error')),
        });
        const beforestop = jest.fn();
        const stoperror = jest.fn();
        app.on('beforestop', beforestop).on('stoperror', stoperror);
        await app.start();
        await expect(app.stop()).rejects.toThrow();

        expect(beforestop).toHaveBeenCalledTimes(1);
        expect(stoperror).toHaveBeenCalledTimes(1);
    });

    it(`emit beforeupdate/afterupdate`, async () => {
        const app = createApp({
            update: jest.fn(),
        });
        const beforeupdate = jest.fn();
        const afterupdate = jest.fn();
        app.on('beforeupdate', beforeupdate).on('afterupdate', afterupdate);
        await app.start();
        await app.update({});

        expect(beforeupdate).toHaveBeenCalledTimes(1);
        expect(afterupdate).toHaveBeenCalledTimes(1);
    });

    it(`emit beforeupdate/updateerror`, async () => {
        const app = createApp({
            update: () => Promise.reject(Error('mock error')),
        });
        const beforeupdate = jest.fn();
        const updateerror = jest.fn();
        app.on('beforeupdate', beforeupdate).on('updateerror', updateerror);
        await app.start();
        await expect(app.update({})).rejects.toThrow();

        expect(beforeupdate).toHaveBeenCalledTimes(1);
        expect(updateerror).toHaveBeenCalledTimes(1);
    });

    it(`emit throws won't break down`, async () => {
        const app = createApp();
        app.on('beforestart', () => {
            throw new Error('mock error');
        });

        await expect(app.start()).resolves.toBeUndefined();
    });
});
