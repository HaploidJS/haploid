let eventCount = 0;
function onEvent() {
    document.querySelector('#events-count').textContent = `${++eventCount}`;
}

function bootstrap() {
    document.addEventListener('escaped-event', onEvent);
    window.addEventListener('escaped-event', onEvent);

    document.addEventListener('unescaped-event', onEvent);
    window.addEventListener('unescaped-event', onEvent);
}

function mount({ domElement }) {
    domElement.innerHTML = `
    <button type="button" id="fire-escaped">发送事件</button>
    <span id="events-count"></span>
`;

    document.querySelector('#fire-escaped').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('escaped-event'));
        document.dispatchEvent(new CustomEvent('unescaped-event'));
        window.dispatchEvent(new CustomEvent('escaped-event'));
        window.dispatchEvent(new CustomEvent('unescaped-event'));
    });
}

function unmount({ domElement }) {
    domElement.innerHTML = '';
}

window[Date.now()] = { bootstrap, mount, unmount };
