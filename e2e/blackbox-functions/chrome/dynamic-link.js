const dynamicLinkResults = [];
let nextSiblingResult = '';

function bootstrap() {
    const link = document.createElement('link');
    const link2 = document.createElement('link');
    const link3 = document.createElement('link');

    link.href = './fixtures/success.css';
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.crossOrigin = 'anonymous';

    link2.href = './fixtures/404.css';
    link3.href = './fixtures/syntax.css';

    const p = new Promise(resolve => {
        link.addEventListener('load', () => {
            dynamicLinkResults.push('1load');
            resolve();
        });
        link.onload = () => {
            dynamicLinkResults.push('1load');
            resolve();
        };
        link.addEventListener('error', () => {
            resolve();
        });
    });

    const p2 = new Promise(resolve => {
        link2.addEventListener('load', () => {
            resolve();
        });
        link2.addEventListener('error', () => {
            dynamicLinkResults.push('2error');
            resolve();
        });
        link2.onerror = () => {
            dynamicLinkResults.push('2error');
            resolve();
        };
    });

    const p3 = new Promise(resolve => {
        link3.addEventListener('load', () => {
            dynamicLinkResults.push('3load');
            resolve();
        });
        link3.addEventListener('error', () => {
            resolve();
        });
    });

    document.head.append(link);
    document.head.append(link2);
    document.head.append(link3);

    return Promise.allSettled([p, p2, p3])
        .then(
            () => {},
            () => {}
        )
        .finally(() => {
            nextSiblingResult = hasRightStyleSibling(link);
        });
}

function hasRightStyleSibling(node) {
    const sb = node.nextElementSibling;
    return sb.nodeName === 'STYLE' && sb.textContent.includes('.success-dynamic-link');
}

module.exports = {
    bootstrap,
    mount({ domElement }) {
        domElement.innerHTML = `
            <span class="linkEvents">${dynamicLinkResults.sort().join('/')}</span>
            <span class="nextSibling">${nextSiblingResult}</span>
        `;
    },
    unmount({ domElement }) {
        domElement.innerHTML = '';
    },
};
