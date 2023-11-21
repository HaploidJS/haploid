import { createApp } from './utils';

describe.only(`hooks-break`, () => {
    it(`beforestart doesn't break down`, async () => {
        const beforestart = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.beforestart.tapPromise('test', () => {
            beforestart();
            return Promise.reject(Error('mock error'));
        });

        await expect(app.start()).resolves.toBeUndefined();
        expect(beforestart).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`afterstart doesn't break down`, async () => {
        const afterstart = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.afterstart.tapPromise('test', () => {
            afterstart();
            return Promise.reject(Error('mock error'));
        });

        await expect(app.start()).resolves.toBeUndefined();
        expect(afterstart).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`starterror doesn't break down`, async () => {
        const starterror = jest.fn();
        const app = createApp({
            bootstrap: () => Promise.reject(Error('start error')),
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.starterror.tapPromise('test', () => {
            starterror();
            return Promise.reject(Error('mock error'));
        });

        await expect(app.start()).rejects.toThrow('start error');
        expect(starterror).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`beforestop doesn't break down`, async () => {
        const beforestop = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.beforestop.tapPromise('test', () => {
            beforestop();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.stop()).resolves.toBeUndefined();
        expect(beforestop).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`afterstop doesn't break down`, async () => {
        const afterstop = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.afterstop.tapPromise('test', () => {
            afterstop();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.stop()).resolves.toBeUndefined();
        expect(afterstop).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`stoperror doesn't break down`, async () => {
        const stoperror = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: () => Promise.reject(Error('stop error')),
        });

        app.hooks.stoperror.tapPromise('test', () => {
            stoperror();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.stop()).rejects.toThrow('stop error');
        expect(stoperror).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`beforeupdate doesn't break down`, async () => {
        const beforeupdate = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
            update: jest.fn(),
        });

        app.hooks.beforeupdate.tapPromise('test', () => {
            beforeupdate();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.update({})).resolves.toBeUndefined();
        expect(beforeupdate).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`afterupdate doesn't break down`, async () => {
        const afterupdate = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
            update: jest.fn(),
        });

        app.hooks.afterupdate.tapPromise('test', () => {
            afterupdate();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.update({})).resolves.toBeUndefined();
        expect(afterupdate).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`updateerror doesn't break down`, async () => {
        const updateerror = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
            update: () => Promise.reject(Error('update error')),
        });

        app.hooks.updateerror.tapPromise('test', () => {
            updateerror();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.update({})).rejects.toThrow('update error');
        expect(updateerror).toHaveBeenCalledTimes(1);

        await app.unload();
    });

    it(`beforeunload doesn't break down`, async () => {
        const beforeunload = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.beforeunload.tapPromise('test', () => {
            beforeunload();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.unload()).resolves.toBeUndefined();
        expect(beforeunload).toHaveBeenCalledTimes(1);
    });

    it(`afterunload doesn't break down`, async () => {
        const afterunload = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.afterunload.tapPromise('test', () => {
            afterunload();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.unload()).resolves.toBeUndefined();
        expect(afterunload).toHaveBeenCalledTimes(1);
    });

    it.skip(`unloaderror doesn't break down`, async () => {
        const unloaderror = jest.fn();
        const app = createApp({
            mount: jest.fn(),
            unmount: jest.fn(),
        });

        app.hooks.updateerror.tapPromise('test', () => {
            unloaderror();
            return Promise.reject(Error('mock error'));
        });
        await app.start();

        await expect(app.unload()).rejects.toThrow('update error');
        expect(unloaderror).toHaveBeenCalledTimes(1);
    });
});
