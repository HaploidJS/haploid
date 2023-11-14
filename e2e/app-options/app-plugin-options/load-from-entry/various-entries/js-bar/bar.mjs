export function mount({ domElement, name }) {
    domElement.innerHTML = `<h1>${name} mounted</h1>`;
}
export function unmount({ domElement }) {
    domElement.innerHTML = '';
}
