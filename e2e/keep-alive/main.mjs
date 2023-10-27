import { ManualContainer } from './haploid.esm.dev.js';

const container = new ManualContainer({
    name: 'keep-alive',
    root: '#app',
});

container.registerApps([
    {
        name: 'foo',
        keepAlive: {
            useHiddenAttribute: true,
            useHiddenClass: 'test-hidden',
        },
        entry: './foo.mjs',
    },
    {
        name: 'bar',
        keepAlive: {
            detachDOM: true,
        },
        entry: './bar.mjs',
    },
]);

document.querySelector('#destroy').addEventListener('click', () => {
    container.destroy();
});

document.querySelector('#activate-foo').addEventListener('click', () => {
    container.activateApp('foo');
});

document.querySelector('#activate-bar').addEventListener('click', () => {
    container.activateApp('bar');
});
