import { createLifecycle } from './utils';

// These hooks will never break down.
describe.only('hooks-break', () => {
    let lifecycle: ReturnType<typeof createLifecycle>;

    beforeEach(() => {
        lifecycle = createLifecycle({
            update: jest.fn(),
        });
    });

    afterEach(() => lifecycle.clear());

    function createThrowFn(): () => never {
        return () => {
            throw Error('fake');
        };
    }

    /* #### bootstrap #### */

    it(`rejecting beforebootstrap hook doesn't break down`, async () => {
        const beforebootstrap = jest.fn(createThrowFn());
        const bootstrap = jest.fn();

        lifecycle.hooks.beforebootstrap.tap('test', beforebootstrap);
        lifecycle.hooks.bootstrap.tap('test', bootstrap);

        await lifecycle.bootstrap();

        expect(beforebootstrap).toHaveBeenCalled();
        expect(bootstrap).toHaveBeenCalled();
    });

    it(`rejecting afterbootstrap hook doesn't break down`, async () => {
        const afterbootstrap = jest.fn(createThrowFn());
        const bootstrap = jest.fn();

        lifecycle.hooks.afterbootstrap.tap('test', afterbootstrap);
        lifecycle.hooks.bootstrap.tap('test', bootstrap);

        await lifecycle.bootstrap();

        expect(afterbootstrap).toHaveBeenCalled();
        expect(bootstrap).toHaveBeenCalled();
    });

    it(`rejecting bootstraperror hook doesn't break down`, async () => {
        const bootstraperror = jest.fn(createThrowFn());
        const bootstrap = jest.fn(createThrowFn());

        lifecycle.hooks.bootstraperror.tap('test', bootstraperror);
        lifecycle.hooks.bootstrap.tap('test', bootstrap);

        await lifecycle.bootstrap().catch(e => e);

        expect(bootstraperror).toHaveBeenCalled();
        expect(bootstrap).toHaveBeenCalled();
    });

    /* #### mount #### */

    it(`rejecting beforemount hook doesn't break down`, async () => {
        const beforemount = jest.fn(createThrowFn());
        const mount = jest.fn();

        lifecycle.hooks.beforemount.tap('test', beforemount);
        lifecycle.hooks.mount.tap('test', mount);

        await lifecycle.mount();

        expect(beforemount).toHaveBeenCalled();
        expect(mount).toHaveBeenCalled();
    });

    it(`rejecting aftermount hook doesn't break down`, async () => {
        const aftermount = jest.fn(createThrowFn());
        const mount = jest.fn();

        lifecycle.hooks.aftermount.tap('test', aftermount);
        lifecycle.hooks.mount.tap('test', mount);

        await lifecycle.mount();

        expect(aftermount).toHaveBeenCalled();
        expect(mount).toHaveBeenCalled();
    });

    it(`rejecting mounterror hook doesn't break down`, async () => {
        const mounterror = jest.fn(createThrowFn());
        const mount = jest.fn(createThrowFn());

        lifecycle.hooks.mounterror.tap('test', mounterror);
        lifecycle.hooks.mount.tap('test', mount);

        await lifecycle.mount().catch(e => e);

        expect(mounterror).toHaveBeenCalled();
        expect(mount).toHaveBeenCalled();
    });

    /* #### unmount #### */

    it(`rejecting beforeunmount hook doesn't break down`, async () => {
        const beforeunmount = jest.fn(createThrowFn());
        const unmount = jest.fn();

        lifecycle.hooks.beforeunmount.tap('test', beforeunmount);
        lifecycle.hooks.unmount.tap('test', unmount);

        await lifecycle.unmount();

        expect(beforeunmount).toHaveBeenCalled();
        expect(unmount).toHaveBeenCalled();
    });

    it(`rejecting afterunmount hook doesn't break down`, async () => {
        const afterunmount = jest.fn(createThrowFn());
        const unmount = jest.fn();

        lifecycle.hooks.afterunmount.tap('test', afterunmount);
        lifecycle.hooks.unmount.tap('test', unmount);

        await lifecycle.unmount();

        expect(afterunmount).toHaveBeenCalled();
        expect(unmount).toHaveBeenCalled();
    });

    it(`rejecting unmounterror hook doesn't break down`, async () => {
        const unmounterror = jest.fn(createThrowFn());
        const unmount = jest.fn(createThrowFn());

        lifecycle.hooks.unmounterror.tap('test', unmounterror);
        lifecycle.hooks.unmount.tap('test', unmount);

        await lifecycle.unmount().catch(e => e);

        expect(unmounterror).toHaveBeenCalled();
        expect(unmount).toHaveBeenCalled();
    });

    /* #### update #### */

    it(`rejecting beforeupdate hook doesn't break down`, async () => {
        const beforeupdate = jest.fn(createThrowFn());
        const update = jest.fn();

        lifecycle.hooks.beforeupdate.tap('test', beforeupdate);
        lifecycle.hooks.update.tap('test', update);

        const updateProps = { a: 1 };

        await lifecycle.update(updateProps);

        expect(beforeupdate).toHaveBeenCalledWith({ props: updateProps });
        expect(update).toHaveBeenCalled();
    });

    it(`rejecting afterupdate hook doesn't break down`, async () => {
        const afterupdate = jest.fn(createThrowFn());
        const update = jest.fn();

        lifecycle.hooks.afterupdate.tap('test', afterupdate);
        lifecycle.hooks.update.tap('test', update);

        const updateProps = { a: 1 };

        await lifecycle.update(updateProps);

        expect(afterupdate).toHaveBeenCalledWith({ props: updateProps });
        expect(update).toHaveBeenCalled();
    });

    it(`rejecting updateerror hook doesn't break down`, async () => {
        const updateerror = jest.fn(createThrowFn());
        const update = jest.fn(createThrowFn());

        lifecycle.hooks.updateerror.tap('test', updateerror);
        lifecycle.hooks.update.tap('test', update);

        const updateProps = { a: 1 };

        const err = await lifecycle.update(updateProps).catch(e => e);

        // props in Error
        expect(Reflect.get(err, 'props')).toBe(updateProps);

        expect(updateerror).toHaveBeenCalled();
        expect(update).toHaveBeenCalled();
    });
});
