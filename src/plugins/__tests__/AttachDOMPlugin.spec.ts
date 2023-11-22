import { createAttachDOMPlugin } from '../../plugins/AttachDOMPlugin';
import { App } from '../../App';
import { baseDebugger } from '../../utils/Debugger';

describe.only(`AttachDOMPlugin`, () => {
    const debug = baseDebugger.extend('test:AttachDOMPlugin');

    beforeEach(() => {
        const app = document.querySelector('#app');
        if (app) app.innerHTML = '';
    });

    it(`mount/unmount at root DOM`, async () => {
        const app = new App<unknown, unknown>({
            name: 'foo',
            lifecycle: {
                mount: async ({ domElement, name }): Promise<void> => {
                    (domElement as Element).innerHTML = `<span>${name}</span>`;
                },
                unmount: async ({ domElement }): Promise<void> => {
                    (domElement as Element).innerHTML = '';
                },
            },
        });

        createAttachDOMPlugin('#app')({
            app: app.api,
            debug,
        });

        await app.start();
        expect(document.querySelector('#app')?.innerHTML).toContain('<span>foo</span>');
        await app.stop();
        expect(document.querySelector('#app')?.children.length).toBe(0);
    });

    it(`mount/unmount only once in keepAlive`, async () => {
        const mount = jest.fn();
        const unmount = jest.fn();
        const suspend = jest.fn();
        const resume = jest.fn();

        const app = new App<Record<never, never>, { food: string }>({
            name: 'foo',
            keepAlive: true,
            lifecycle: {
                mount,
                unmount,
                suspend,
                resume,
            },
            customProps: {
                food: 'bread',
            },
        });

        createAttachDOMPlugin<Record<never, never>, { food: string }>('#app')({
            app: app.api,
            debug,
        });

        await app.start();
        await app.stop();
        expect(app.appElement?.style.display).toBe('none');
        await app.start();
        await app.stop();
        expect(mount).toHaveBeenCalledTimes(1);
        expect(unmount).toHaveBeenCalledTimes(0);
        expect(suspend).toHaveBeenCalledTimes(2);
        expect(resume).toHaveBeenCalledTimes(1);

        await app.unload();
        expect(unmount).toHaveBeenCalledTimes(1);
        expect(suspend).toHaveBeenCalledTimes(2);
        expect(resume).toHaveBeenCalledTimes(1);
        expect(suspend).toHaveBeenCalledWith(expect.objectContaining({ name: 'foo', food: 'bread' }));
        expect(resume).toHaveBeenCalledWith(expect.objectContaining({ name: 'foo', food: 'bread' }));
    });

    it(`useHiddenAttribute in keepAlive`, async () => {
        const app = new App<unknown, unknown>({
            name: 'foo',
            keepAlive: {
                useHiddenAttribute: true,
            },
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
        });

        createAttachDOMPlugin<unknown, unknown>('#app')({
            app: app.api,
            debug,
        });

        await app.start();
        await app.stop();
        expect(app.appElement?.getAttribute('hidden')).toBe('hidden');
    });

    it(`useHiddenClass in keepAlive`, async () => {
        const app = new App({
            name: 'foo',
            keepAlive: {
                useHiddenClass: 'test-hidden',
            },
            lifecycle: {
                mount: jest.fn(),
                unmount: jest.fn(),
            },
        });

        createAttachDOMPlugin<Record<never, never>, { food: string }>('#app')({
            app: app.api,
            debug,
        });

        await app.start();
        await app.stop();
        expect(app.appElement?.classList.contains('test-hidden')).toBe(true);
    });

    it(`detachDOM in keepAlive`, async () => {
        const mount = jest.fn();
        const unmount = jest.fn();

        const app = new App({
            name: 'foo',
            keepAlive: {
                detachDOM: true,
            },
            lifecycle: {
                mount,
                unmount,
            },
        });

        createAttachDOMPlugin<Record<never, never>, { food: string }>('#app')({
            app: app.api,
            debug,
        });

        await app.start();
        await app.stop();
        expect(document.querySelector('#app')?.childElementCount).toBe(0);
        await app.start();
        await app.stop();

        expect(mount).toHaveBeenCalledTimes(1);
        expect(unmount).toHaveBeenCalledTimes(0);
    });
});
