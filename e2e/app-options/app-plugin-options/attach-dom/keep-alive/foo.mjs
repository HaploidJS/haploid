export function mount({ domElement, name }) {
    globalThis[`${name}-mounted`] = true;
    domElement.innerHTML = `<span class="${name}">mounted</span>`;
}
export function unmount({ domElement, name }) {
    delete globalThis[`${name}-mounted`];
    domElement.innerHTML = '';
}
