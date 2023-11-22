import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'css-fix',
    root: '#app',
});

container.registerApps([
    {
        name: 'by-regexp',
        activeWhen: '#/by-regexp',
        entry: './apps/by-regexp.html',
        jsExportType: 'global',
        // dropURLFixInCSSByStyleSheet: false, default
    },
    {
        name: 'by-api',
        activeWhen: '#/by-api',
        entry: './apps/by-api.html',
        dropURLFixInCSSByStyleSheet: false,
        jsExportType: 'global',
    },
]);

container.run();
