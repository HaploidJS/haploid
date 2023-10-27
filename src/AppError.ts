export class AppError extends Error {
    public interrupted = false;
}

export function createInterruptedError(message: string): AppError {
    const e = new AppError(message);
    e.interrupted = true;
    return e;
}
