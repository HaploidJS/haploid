const count = globalThis.count;

export function mount({ domElement, name }) {
    domElement.innerHTML = `
    <h1>${name} mounted</h1>
    <div id="foo" class="foo">
        count: <strong>${count}</strong>
    </div>
`;
}
export function unmount({ domElement }) {
    domElement.innerHTML = '';
}
