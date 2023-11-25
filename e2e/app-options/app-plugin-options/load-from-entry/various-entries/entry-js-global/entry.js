function mount({ domElement, name }) {
    domElement.innerHTML = `<h1>${name} mounted</h1>`;
}
function unmount({ domElement }) {
    domElement.innerHTML = '';
}

window[Math.random()] = { mount, unmount };
