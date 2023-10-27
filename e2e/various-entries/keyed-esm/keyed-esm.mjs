function mount({ domElement, name }) {
    domElement.innerHTML = `<h1>${name} mounted</h1>`;
}
function unmount({ domElement }) {
    domElement.innerHTML = '';
}

export const __HAPLOID_LIFECYCLE_EXPORT__ = Promise.resolve().then(() => {
    return {
        mount,
        unmount,
    };
});
