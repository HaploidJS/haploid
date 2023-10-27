import { RouterContainer } from './haploid.esm.dev.js';

const container = new RouterContainer({
    name: 'fallbacl-url',
    root: '#app',
    fallbackUrl: '/foo',
    fallbackOnlyWhen: loc => loc.pathname === '/',
});

container.registerApps([
    {
        name: 'foo',
        activeWhen: '/foo',
        lifecycle: {
            mount({ domElement, name }) {
                domElement.innerHTML = `${name} mounted`;
            },
            unmount({ domElement }) {
                domElement.innerHTML = '';
            },
        },
    },
]);

container.run();
