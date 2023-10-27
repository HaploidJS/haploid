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
        activeWhen: '/env',
    },
    {
        name: 'dynamic-script',
        sandbox: true,
        entry: './dynamic-script.js',
        activeWhen: '/dynamic-script',
    },
    {
        name: 'dynamic-link',
        sandbox: true,
        entry: './dynamic-link.js',
        activeWhen: '/dynamic-link',
    },
    {
        name: 'escaped-events',
        sandbox: {
            escapeWindowEvents: ['escaped-event'],
            escapeDocumentEvents: ['escaped-event'],
        },
        entry: './escaped-events.js',
        activeWhen: '/escaped-events',
    },
    {
        name: 'scoped-events',
        sandbox: true,
        entry: './scoped-events.js',
        activeWhen: '/scoped-events',
    },
]);

container.run();
