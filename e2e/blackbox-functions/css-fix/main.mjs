import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'css-fix',
    root: '#app',
});

container.registerApps([
    {
        name: 'fix-url',
        activeWhen: '#/fix-url',
        entry: './apps/fix-url.html',
        jsExportType: 'global',
    },
    {
        name: 'force-regexp',
        activeWhen: '#/force-regexp',
        entry: './apps/force-regexp.html',
        dropURLFixInCSSByStyleSheet: true,
        jsExportType: 'global',
    },
]);

container.run();
