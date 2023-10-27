const docScript = document.currentScript;

console.log(`document.currentScript(${docScript.src}, ${docScript.crossOrigin}):`, docScript);

window.ondynamicscriptload(
    docScript.type === 'text/javascript' &&
        docScript.crossOrigin === 'anonymous' &&
        docScript.hasAttribute('defer') &&
        docScript.src === `${location.origin}/fixtures/success.js`
);
