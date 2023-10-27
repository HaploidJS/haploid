import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'various-entries',
    root: '#app',
});

container.registerApps([
    {
        name: 'foo',
        activeWhen: '/foo',
        entry: './html-foo/',
    },
    {
        name: 'bar',
        activeWhen: '/bar',
        entry: './js-bar/bar.mjs',
    },
    {
        name: 'keyed-esm',
        activeWhen: '/keyed-esm',
        entry: './keyed-esm/keyed-esm.mjs',
    },
    {
        name: 'baz',
        activeWhen: '/baz',
        entry: './json-baz/baz.json',
    },
    {
        name: 'asset',
        activeWhen: '/asset',
        assetsMap: () =>
            Promise.resolve({
                module: 'esm',
                version: 1,
                initial: {
                    js: ['./assets-json/entry.js'],
                },
            }),
    },
    {
        name: 'lf',
        activeWhen: '/lf',
        lifecycle: () =>
            Promise.resolve({
                mount({ domElement, name }) {
                    domElement.innerHTML = `<h1>${name} mounted</h1>`;
                },
                unmount({ domElement }) {
                    domElement.innerHTML = '';
                },
            }),
    },
]);

container.run();
