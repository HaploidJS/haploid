import { smellsLikeAPromise } from './smellsLikeAPromise';

type NotPromise<T> = T extends Promise<unknown> ? never : T;
type NotFunction<T> = T extends () => unknown ? never : T;

type Clear<T> = NotFunction<NotPromise<T>>;

export type Transformable<T> = Clear<T> | Promise<Clear<T>> | (() => Clear<T>) | (() => Promise<Clear<T>>);

export const normalizeTransformable = <K>(data: Transformable<K>): Promise<K> => {
    if ('object' === typeof data && data && smellsLikeAPromise(data)) {
        return Promise.resolve(data as Promise<K>);
    }

    if ('function' === typeof data) {
        return normalizeTransformable<K>((data as (() => Clear<K>) | (() => Promise<Clear<K>>))());
    }

    return Promise.resolve(data as K);
};
