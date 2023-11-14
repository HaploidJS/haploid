const dynamicScriptResults = [];
let docCurrentScriptCorrect = document.currentScript.src.includes('dynamic-script.js');

window.ondynamicscriptload = result => {
    docCurrentScriptCorrect = docCurrentScriptCorrect && result;
};

function bootstrap() {
    const script = document.createElement('script');
    const script2 = document.createElement('script');
    const script3 = document.createElement('script');

    script.src = './fixtures/success.js';
    script.type = 'text/javascript';
    script.defer = true;
    script.crossOrigin = 'anonymous';

    script2.src = './fixtures/404.js';
    script3.src = './fixtures/syntax.js';

    const p = new Promise(resolve => {
        script.addEventListener('load', () => {
            dynamicScriptResults.push('1load');
            resolve();
        });
        script.onload = () => {
            dynamicScriptResults.push('1load');
            resolve();
        };
        script.addEventListener('error', () => {
            resolve();
        });
    });

    const p2 = new Promise(resolve => {
        script2.addEventListener('load', () => {
            resolve();
        });
        script2.addEventListener('error', () => {
            dynamicScriptResults.push('2error');
            resolve();
        });
        script2.onerror = () => {
            dynamicScriptResults.push('2error');
            resolve();
        };
    });

    const p3 = new Promise(resolve => {
        script3.addEventListener('load', () => {
            dynamicScriptResults.push('3load');
            resolve();
        });
        script3.addEventListener('error', () => {
            resolve();
        });
    });

    document.head.append(script);
    document.head.append(script2);
    document.head.append(script3);

    return Promise.allSettled([p, p2, p3]).then(
        () => {},
        () => {}
    );
}

window[Date.now().toString(36)] = {
    bootstrap,
    mount({ domElement }) {
        domElement.innerHTML = `
            <span class="scriptEvents">${dynamicScriptResults.sort().join('/')}</span>
            <span class="currentScript">${docCurrentScriptCorrect}</span>
        `;
    },
    unmount({ domElement }) {
        domElement.innerHTML = '';
    },
};
