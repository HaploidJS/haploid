export function mount({ domElement }) {
    domElement.innerHTML = '<center>MOUNTED</center>';
}
export function unmount({ domElement }) {
    domElement.innerHTML = '';
}
