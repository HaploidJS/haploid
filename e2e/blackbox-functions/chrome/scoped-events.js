const eventPhaseResult = [];
const currentTargetResult = [];

function onWindowCapture(evt) {
    eventPhaseResult.push(evt.eventPhase);
    currentTargetResult.push(evt.currentTarget);
}

function onWindowBubble(evt) {
    eventPhaseResult.push(evt.eventPhase);
    currentTargetResult.push(evt.currentTarget);
}

function onDocumentCapture(evt) {
    eventPhaseResult.push(evt.eventPhase);
    currentTargetResult.push(evt.currentTarget);
}

function onDocumentBubble(evt) {
    eventPhaseResult.push(evt.eventPhase);
    currentTargetResult.push(evt.currentTarget);
}

function bootstrap() {
    window.addEventListener('fooevent', onWindowBubble);
    window.addEventListener('fooevent', onWindowCapture, true);
    document.addEventListener('fooevent', onDocumentBubble);
    document.addEventListener('fooevent', onDocumentCapture, true);
}

function mount({ domElement }) {
    domElement.innerHTML = `
    <button type="button" id="fire-phase-event">发送事件</button>
    <span id="phase-result"></span>
`;

    document.querySelector('#fire-phase-event').addEventListener('click', () => {
        const event = new Event('fooevent', {
            bubbles: true,
        });
        document.dispatchEvent(event);

        const composedPaths = event.composedPath();

        document.querySelector('#phase-result').textContent =
            eventPhaseResult.length === 4 &&
            eventPhaseResult[0] === Event.CAPTURING_PHASE &&
            eventPhaseResult[1] === Event.AT_TARGET &&
            eventPhaseResult[2] === Event.AT_TARGET &&
            eventPhaseResult[3] === Event.BUBBLING_PHASE &&
            currentTargetResult.length === 4 &&
            currentTargetResult[0] === window &&
            currentTargetResult[1] === document &&
            currentTargetResult[2] === document &&
            currentTargetResult[0] === window &&
            event.type === 'fooevent' &&
            event.target === document &&
            event.eventPhase === Event.NONE &&
            event.currentTarget === null &&
            composedPaths[0] === document &&
            composedPaths[1] === window;
    });
}

function unmount({ domElement }) {
    domElement.innerHTML = '';
}

module.exports = { bootstrap, mount, unmount };
