import { ManualContainer } from '@/index';
import { delay } from '../test-utils';

describe.only('preload', () => {
    it('preload=true', async () => {
        const container = new ManualContainer({
            name: 'foo',
            root: '#app',
            preload: true,
        });

        const app = container.registerApp({
            name: 'bar',
            entry: `//localhost:10810/Container/preload-true.js?content=${encodeURIComponent(
                `module.exports = {mount(){}, unmount(){}}`
            )}`,
            preloadDelay: 500,
        });

        const onAfterLoad = jest.fn();

        app.on('afterload', onAfterLoad);

        await delay(1000);

        expect(onAfterLoad).toHaveBeenCalled();
    });

    it('preload=false', async () => {
        const container = new ManualContainer({
            name: 'foo',
            root: '#app',
            preload: false,
        });

        const app = container.registerApp({
            name: 'bar',
            entry: `//localhost:10810/Container/preload-false.js?content=${encodeURIComponent(
                `module.exports = {mount(){}, unmount(){}}`
            )}`,
            preloadDelay: 500,
        });

        const onAfterLoad = jest.fn();

        app.on('afterload', onAfterLoad);

        await delay(1000);

        expect(onAfterLoad).not.toHaveBeenCalled();
    });

    it('preload=auto', async () => {
        let container = new ManualContainer({
            name: 'foo',
            root: '#app',
            preload: 'auto',
        });

        container.registerApp({
            name: 'bar',
            entry: `//localhost:10810/Container/preload-auto.js?content=${encodeURIComponent(
                `module.exports = {mount(){}, unmount(){}}`
            )}`,
        });

        await container.activateApp('bar');
        await container.destroy();

        container = new ManualContainer({
            name: 'foo',
            root: '#app',
            preload: 'auto',
        });

        const app = container.registerApp({
            name: 'bar',
            entry: `//localhost:10810/Container/preload-auto.js?content=${encodeURIComponent(
                `module.exports = {mount(){}, unmount(){}}`
            )}`,
            preloadDelay: 500,
        });

        const onAfterLoad = jest.fn();

        app.on('afterload', onAfterLoad);

        await delay(1000);

        expect(onAfterLoad).toHaveBeenCalled();
        expect(container.getHotVisitApps()).toEqual(expect.arrayContaining(['bar']));
    });
});
