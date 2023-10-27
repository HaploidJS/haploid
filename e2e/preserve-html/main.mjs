import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'preserve-html',
    root: '#app',
});

container.registerApps([
    {
        name: 'sync-app-html',
        entry: './sync-app-html/index.html',
        preserveHTML: true,
        activeWhen: '/sync-app-html',
    },
    {
        name: 'preset-options-prefer',
        entry: './sync-app-html/index.html',
        preserveHTML: true,
        presetBodyHTML: '<div id="preset-options-prefer"></div>',
        presetHeadHTML: '<meta name="keywords" content="">',
        title: 'override title',
        activeWhen: '/preset-options-prefer',
    },
]);

container.run();
