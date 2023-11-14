import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'various-entries',
    root: '#app',
});

container.registerApps([
    {
        name: 'entry-html',
        activeWhen: loc => loc.hash === '#/entry-html',
        entry: './entry-html/index.html',
    },
    {
        name: 'entry-js-esm',
        activeWhen: loc => loc.hash === '#/entry-js-esm',
        entry: './entry-js-esm/entry.mjs',
    },
    {
        name: 'entry-js-esm-keyed',
        activeWhen: loc => loc.hash === '#/entry-js-esm-keyed',
        entry: './entry-js-esm-keyed/entry.mjs',
    },
    {
        name: 'entry-js-umd',
        activeWhen: loc => loc.hash === '#/entry-js-umd',
        entry: './entry-js-umd/entry.js',
    },
    {
        name: 'entry-json',
        activeWhen: loc => loc.hash === '#/entry-json',
        entry: './entry-json/entry.json',
    },
    {
        name: 'entry-assetmap-esm',
        activeWhen: loc => loc.hash === '#/entry-assetmap-esm',
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
        activeWhen: loc => loc.hash === '#/entry-assetmap-umd',
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
        activeWhen: loc => loc.hash === '#/lifecycle',
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
