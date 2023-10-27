export class DOMContentLoadedEvent extends Event {
    constructor() {
        super('DOMContentLoaded', {
            bubbles: true,
            cancelable: false,
        });
    }
}

interface BeforeUnloadEventConstructor {
    new (): Event;
}

let HaploidBeforeUnloadEvent: BeforeUnloadEventConstructor;

if ('undefined' === typeof BeforeUnloadEvent) {
    HaploidBeforeUnloadEvent = class extends Event {
        constructor() {
            super('beforeunload', {
                bubbles: false,
                cancelable: true,
            });
        }
    };
} else {
    HaploidBeforeUnloadEvent = BeforeUnloadEvent;
}

export { HaploidBeforeUnloadEvent };
