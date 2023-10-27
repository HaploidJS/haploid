import { createLifecycle } from './utils';

describe.only('hooks', () => {
    let lifecycle: ReturnType<typeof createLifecycle>;

    beforeEach(() => {
        lifecycle = createLifecycle();
    });

    afterEach(() => lifecycle.clear());

    function createBailFn(): () => true | void {
        let index = 0;
        return (): true | void => {
            if (index++) throw Error('fake');
            return true;
        };
    }

    it(`custom beforebootstrap/bootstrap/afterbootstrap/bootstraperror`, async () => {
        const beforebootstrap = jest.fn();
        const bootstrap = jest.fn(createBailFn());
        const afterbootstrap = jest.fn();
        const bootstraperror = jest.fn();

        lifecycle.hooks.beforebootstrap.tap('test', beforebootstrap);
        lifecycle.hooks.bootstrap.tap('test', bootstrap);
        lifecycle.hooks.afterbootstrap.tap('test', afterbootstrap);
        lifecycle.hooks.bootstraperror.tap('test', bootstraperror);

        await lifecycle.bootstrap();
        expect(beforebootstrap).toHaveBeenCalled();
        expect(bootstrap).toHaveBeenCalled();
        expect(afterbootstrap).toHaveBeenCalled();

        await expect(lifecycle.bootstrap()).rejects.toThrow(/fake/); // This will fail.
        expect(bootstraperror).toHaveBeenCalled();
    });

    it(`custom beforemount/mount/aftermount/mount`, async () => {
        const beforemount = jest.fn();
        const mount = jest.fn(createBailFn());
        const aftermount = jest.fn();
        const mounterror = jest.fn();

        lifecycle.hooks.beforemount.tap('test', beforemount);
        lifecycle.hooks.mount.tap('test', mount);
        lifecycle.hooks.aftermount.tap('test', aftermount);
        lifecycle.hooks.mounterror.tap('test', mounterror);

        await lifecycle.mount();
        expect(beforemount).toHaveBeenCalled();
        expect(mount).toHaveBeenCalled();
        expect(aftermount).toHaveBeenCalled();

        await expect(lifecycle.mount()).rejects.toThrow(/fake/); // This will fail.
        expect(aftermount).toHaveBeenCalled();
    });

    it(`custom beforeunmount/unmount/afterunmount/unmounterror`, async () => {
        const beforeunmount = jest.fn();
        const unmount = jest.fn(createBailFn());
        const afterunmount = jest.fn();
        const unmounterror = jest.fn();

        lifecycle.hooks.beforeunmount.tap('test', beforeunmount);
        lifecycle.hooks.unmount.tap('test', unmount);
        lifecycle.hooks.afterunmount.tap('test', afterunmount);
        lifecycle.hooks.unmounterror.tap('test', unmounterror);

        await lifecycle.unmount();
        expect(beforeunmount).toHaveBeenCalled();
        expect(unmount).toHaveBeenCalled();
        expect(afterunmount).toHaveBeenCalled();

        await expect(lifecycle.unmount()).rejects.toThrow(/fake/); // This will fail.
        expect(unmounterror).toHaveBeenCalled();
    });

    it(`custom beforeupdate/update/afterupdate/updateerror`, async () => {
        const beforeupdate = jest.fn();
        const update = jest.fn(createBailFn());
        const afterupdate = jest.fn();
        const updateerror = jest.fn();

        lifecycle.hooks.beforeupdate.tap('test', beforeupdate);
        lifecycle.hooks.update.tap('test', update);
        lifecycle.hooks.afterupdate.tap('test', afterupdate);
        lifecycle.hooks.updateerror.tap('test', updateerror);

        const updateProps = { a: 1 };

        await lifecycle.update(updateProps);
        expect(beforeupdate).toHaveBeenCalledWith({ props: updateProps });
        expect(update).toHaveBeenCalledWith({ props: updateProps });
        expect(afterupdate).toHaveBeenCalledWith({ props: updateProps });

        await expect(lifecycle.update(updateProps)).rejects.toThrow(/fake/); // This will fail.
        expect(updateerror).toHaveBeenCalled();
    });
});
