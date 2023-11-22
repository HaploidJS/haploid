import markExternal from 'mark-external';

function mount() {
    const div = document.createElement('div');
    div.className = 'var-external';
    div.append(`external:${markExternal}`);
    document.body.append(div);
}
function unmount() {}

export default { mount, unmount };
