import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'various-entries',
    root: '#app',
});

container.registerApps([
    {
        name: 'foo',
        activeWhen: loc => loc.hash === '#/foo',
        entry: './html-foo/index.html',
    },
    {
        name: 'bar',
        activeWhen: loc => loc.hash === '#/bar',
        entry: './js-bar/bar.mjs',
    },
    {
        name: 'keyed-esm',
        activeWhen: loc => loc.hash === '#/keyed-esm',
        entry: './keyed-esm/keyed-esm.mjs',
    },
    {
        name: 'baz',
        activeWhen: loc => loc.hash === '#/baz',
        entry: './json-baz/baz.json',
    },
    {
        name: 'asset',
        activeWhen: loc => loc.hash === '#/asset',
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
        activeWhen: loc => loc.hash === '#/lf',
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
