import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'sandbox',
    root: '#app',
});

container.registerApps([
    {
        name: 'env',
        sandbox: {
            escapeVariables: ['__GLOBAL_ESCAPE_VAR__'],
            enableBodyPretending: true,
            enableHeadPretending: true,
            enableHtmlPretending: true,
            enableTitlePretending: true,
        },
        keepAlive: true,
        entry: './env.js',
        envVariables: {
            __ENV_VAR__: true,
        },
        activeWhen: loc => loc.hash === '#/env',
    },
    {
        name: 'dynamic-script',
        sandbox: true,
        entry: './dynamic-script.js',
        activeWhen: loc => loc.hash === '#/dynamic-script',
    },
    {
        name: 'dynamic-link',
        sandbox: true,
        entry: './dynamic-link.js',
        activeWhen: loc => loc.hash === '#/dynamic-link',
    },
    {
        name: 'escaped-events',
        sandbox: {
            escapeWindowEvents: ['escaped-event'],
            escapeDocumentEvents: ['escaped-event'],
        },
        entry: './escaped-events.js',
        activeWhen: loc => loc.hash === '#/escaped-events',
    },
    {
        name: 'scoped-events',
        sandbox: true,
        entry: './scoped-events.js',
        activeWhen: loc => loc.hash === '#/scoped-events',
    },
]);

container.run();
