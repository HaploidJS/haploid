/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseDebugger } from '../../utils/Debugger';

const debug = baseDebugger.extend('eventListenerPatcher');

export interface EventManipulator {
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean
    ): void;
    destroy: () => void;
    queryListeners(type: string, useCapture: boolean): EventListenerOrEventListenerObject[];
}

type ListenerParams = {
    rawListener: EventListenerOrEventListenerObject;
    bindListener: EventListenerOrEventListenerObject;
    capture: boolean;
};

function parseCapture(opt: any): boolean {
    if ('boolean' === typeof opt) {
        return opt;
    }

    if (opt) {
        return Boolean(opt.capture);
    }

    return false;
}

export function patchEventListener<T extends EventTarget>(context: T, target: T): EventManipulator {
    const eventsMap: Map<string, Array<ListenerParams>> = new Map();

    function addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean
    ): void {
        if (!callback) return;

        const listenerRecords = eventsMap.get(type) ?? [];

        const bindListener = 'function' === typeof callback ? callback.bind(context) : callback;

        const newRecord: ListenerParams = { rawListener: callback, bindListener, capture: parseCapture(options) };

        const duplicatedRecord = listenerRecords.find(record => {
            return record.rawListener === newRecord.rawListener && record.capture === newRecord.capture;
        });

        if (duplicatedRecord) {
            debug('addEventListener(%s) duplicated: %o.', type, eventsMap);
            return;
        }

        debug('addEventListener(%s) successfully.', type);

        listenerRecords.push(newRecord);

        eventsMap.set(type, listenerRecords);

        target.addEventListener(type, bindListener, options);
    }

    function removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean
    ): void {
        if (!callback) return;

        const listenerRecords = eventsMap.get(type) ?? [];

        const recordIndex = listenerRecords.findIndex(record => {
            return record.rawListener === callback && record.capture === parseCapture(options);
        });

        if (recordIndex === -1) {
            debug('removeEventListener(%s) not found: %o.', type, eventsMap);
            return;
        }

        debug('removeEventListener(%s) successfully.', type);

        const removedRecord = listenerRecords[recordIndex];

        listenerRecords.splice(recordIndex, 1);

        eventsMap.set(type, listenerRecords);

        target.removeEventListener(type, removedRecord.bindListener, options);
        // eventBus.removeEventListener(type, removedRecord.bindListener, options);
    }

    function queryListeners(type: string, useCapture = false): EventListenerOrEventListenerObject[] {
        const listenerRecords = eventsMap.get(type) ?? [];
        return listenerRecords.filter(({ capture }) => capture === useCapture).map(({ bindListener }) => bindListener);
    }

    function destroy(): void {
        for (const [type, listeners] of eventsMap) {
            for (const { bindListener, capture } of listeners) {
                target.removeEventListener(type, bindListener, capture);
                // eventBus.removeEventListener(type, bindListener, capture);
            }
        }

        eventsMap.clear();
    }

    return {
        addEventListener,
        removeEventListener,
        queryListeners,
        destroy,
    };
}
