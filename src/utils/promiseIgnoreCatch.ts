import { simplePromiseAllSettled } from './simplePromiseAllSettled';

export function promiseIgnoreCatch(promise: Promise<unknown>): Promise<void> {
    return simplePromiseAllSettled([promise]);
}
