import { createLifecycle } from './utils';

describe.only(`emit-event`, () => {
    it(`emit beforebootstrap/afterbootstrap`, async () => {
        const lifecycle = createLifecycle();
        const beforebootstrap = jest.fn();
        const afterbootstrap = jest.fn();
        lifecycle.on('beforebootstrap', beforebootstrap);
        lifecycle.on('afterbootstrap', afterbootstrap);

        await lifecycle.bootstrap();

        expect(beforebootstrap).toBeCalledTimes(1);
        expect(afterbootstrap).toBeCalledTimes(1);
    });

    it(`emit beforebootstrap/bootstraperror`, async () => {
        const lifecycle = createLifecycle({
            bootstrap: () => Promise.reject(Error('mock error')),
        });
        const beforebootstrap = jest.fn();
        const bootstraperror = jest.fn();
        lifecycle.on('beforebootstrap', beforebootstrap);
        lifecycle.on('bootstraperror', bootstraperror);

        await expect(lifecycle.bootstrap()).rejects.toThrow();

        expect(beforebootstrap).toBeCalledTimes(1);
        expect(bootstraperror).toBeCalledTimes(1);
    });

    it(`emit beforemount/aftermount`, async () => {
        const lifecycle = createLifecycle();
        const beforemount = jest.fn();
        const aftermount = jest.fn();
        lifecycle.on('beforemount', beforemount);
        lifecycle.on('aftermount', aftermount);

        await lifecycle.mount();

        expect(beforemount).toBeCalledTimes(1);
        expect(aftermount).toBeCalledTimes(1);
    });

    it(`emit beforemount/mounterror`, async () => {
        const lifecycle = createLifecycle({
            mount: () => Promise.reject(Error('mock error')),
        });
        const beforemount = jest.fn();
        const mounterror = jest.fn();
        lifecycle.on('beforemount', beforemount);
        lifecycle.on('mounterror', mounterror);

        await expect(lifecycle.mount()).rejects.toThrow();
        expect(beforemount).toBeCalledTimes(1);
        expect(mounterror).toBeCalledTimes(1);
    });

    it(`emit beforeunmount/afterunmount`, async () => {
        const lifecycle = createLifecycle();
        const beforeunmount = jest.fn();
        const afterunmount = jest.fn();
        lifecycle.on('beforeunmount', beforeunmount);
        lifecycle.on('afterunmount', afterunmount);

        await lifecycle.unmount();

        expect(beforeunmount).toBeCalledTimes(1);
        expect(afterunmount).toBeCalledTimes(1);
    });

    it(`emit beforeunmount/unmounterror`, async () => {
        const lifecycle = createLifecycle({
            unmount: () => Promise.reject(Error('mock error')),
        });
        const beforeunmount = jest.fn();
        const unmounterror = jest.fn();
        lifecycle.on('beforeunmount', beforeunmount);
        lifecycle.on('unmounterror', unmounterror);

        await expect(lifecycle.unmount()).rejects.toThrow();

        expect(beforeunmount).toBeCalledTimes(1);
        expect(unmounterror).toBeCalledTimes(1);
    });

    it(`emit beforeupdate/afterupdate`, async () => {
        const lifecycle = createLifecycle({
            update: jest.fn(),
        });
        const beforeupdate = jest.fn();
        const afterupdate = jest.fn();
        lifecycle.on('beforeupdate', beforeupdate);
        lifecycle.on('afterupdate', afterupdate);

        await lifecycle.update({});

        expect(beforeupdate).toBeCalledTimes(1);
        expect(afterupdate).toBeCalledTimes(1);
    });

    it(`emit beforeupdate/updateerror`, async () => {
        const lifecycle = createLifecycle({
            update: () => Promise.reject(Error('mock error')),
        });
        const beforeupdate = jest.fn();
        const updateerror = jest.fn();
        lifecycle.on('beforeupdate', beforeupdate);
        lifecycle.on('updateerror', updateerror);

        const updateProps = { a: 1 };

        const err = await lifecycle.update(updateProps).catch(e => e);

        // props in Error
        expect(Reflect.get(err, 'props')).toBe(updateProps);

        expect(beforeupdate).toBeCalledTimes(1);
        expect(updateerror).toBeCalledTimes(1);
    });

    it(`emit throws won't break down`, async () => {
        const lifecycle = createLifecycle();
        lifecycle.once('beforemount', () => {
            throw Error('mock error');
        });

        await expect(lifecycle.mount()).resolves.toBeUndefined();
    });
});
