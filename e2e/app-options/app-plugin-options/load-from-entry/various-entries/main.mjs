import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'various-entries',
    root: '#app',
});

container.registerApps([
    {
        name: 'entry-html',
        activeWhen: '#/entry-html',
        entry: './entry-html/index.html',
    },
    {
        name: 'entry-js-esm',
        activeWhen: '#/entry-js-esm',
        entry: './entry-js-esm/entry.mjs',
    },
    {
        name: 'entry-js-esm-keyed',
        activeWhen: '#/entry-js-esm-keyed',
        entry: './entry-js-esm-keyed/entry.mjs',
    },
    {
        name: 'entry-js-umd',
        activeWhen: '#/entry-js-umd',
        entry: './entry-js-umd/entry.js',
    },
    {
        name: 'entry-json',
        activeWhen: '#/entry-json',
        entry: './entry-json/entry.json',
    },
    {
        name: 'entry-assetmap-esm',
        activeWhen: '#/entry-assetmap-esm',
        assetsMap: {
            module: 'esm',
            version: 1,
            initial: {
                js: ['./entry-js-esm/entry.mjs'],
            },
        },
    },
    {
        name: 'entry-assetmap-umd',
        activeWhen: '#/entry-assetmap-umd',
        assetsMap: {
            module: 'umd',
            version: 1,
            initial: {
                js: ['./entry-js-umd/entry.js'],
            },
        },
    },
    {
        name: 'lifecycle',
        activeWhen: '#/lifecycle',
        lifecycle: {
            mount({ domElement, name }) {
                domElement.innerHTML = `<h1>${name} mounted</h1>`;
            },
            unmount({ domElement }) {
                domElement.innerHTML = '';
            },
        },
    },
]);

container.run();
