import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'wrapper-dom',
    root: '#app',
});

const lifecycle = {
    mount({ domElement, name }) {
        domElement.innerHTML = `<p class="${CSS.escape(name)}">${name} mounted</p>`;
    },
    unmount({ domElement }) {
        domElement.innerHTML = '';
    },
};

container.registerApps([
    {
        name: 'default-wrapper',
        activeWhen: '#/default-wrapper',
        lifecycle,
    },
    {
        name: 'mutiple-elements',
        domWrapper: '<div></div><div></div>',
        activeWhen: '#/mutiple-elements',
        lifecycle,
    },
    {
        name: 'no-elements',
        domWrapper: 'TEXT<!-->XX',
        activeWhen: '#/no-elements',
        lifecycle,
    },
    {
        name: 'filter-tags',
        domWrapper: `
            <script></script>
            <body></body>
            <html></html>
            <head></head>
            <title></title>
            <base></base>
            <p class="content" contenteditable onclick=";"></p>`,
        activeWhen: '#/filter-tags',
        lifecycle: {
            mount() {},
            unmount() {},
        },
    },
]);

container.run();

container.on('appregistererror', ({ error }) => {
    document.querySelector('p.error').innerText = error.message;
});

document.querySelector('form').addEventListener('submit', e => {
    e.preventDefault();
    const tx = document.querySelector('textarea');
    const er = document.querySelector('p.error');
    const domWrapper = tx.value;
    tx.value = '';
    er.innerHTML = '';

    container.registerApp({
        name: 'never',
        domWrapper,
        activeWhen: '#/never',
        lifecycle,
    });
});
