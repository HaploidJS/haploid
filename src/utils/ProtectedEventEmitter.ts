export interface ProtectedEventEmitter<EventMap> {
    on<T extends Exclude<keyof EventMap, number>>(
        event: T,
        listener: (event: EventMap[T]) => unknown,
        context?: unknown
    ): this;
    once<T extends Exclude<keyof EventMap, number>>(
        event: T,
        listener: (event: EventMap[T]) => unknown,
        context?: unknown
    ): this;
    off<T extends Exclude<keyof EventMap, number>>(
        event: T,
        listener: (event: EventMap[T]) => unknown,
        context?: unknown
    ): this;
}
