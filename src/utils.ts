export const life = <T>(fn: () => T) => fn()


export type WritableIterator<T> = AsyncIterableIterator<T> & {
    push(value: T): void
    cancel(): void
}

export function writeableIterator<T>(): WritableIterator<T> {
    const deferred: IteratorResult<T>[] = [];
    let signalResolver: ((value: void) => void) | null = null;

    const stream: WritableIterator<T> = {
        push(value: T) {
            deferred.push({ value, done: false });
            if (signalResolver) {
                signalResolver();
                signalResolver = null;
            }
        },
        cancel() {
            deferred.push({ value: undefined, done: true });
            if (signalResolver) {
                signalResolver();
                signalResolver = null;
            }
        },
        async next(): Promise<IteratorResult<T>> {
            while (true) {
                if (deferred.length > 0) {
                    return deferred.shift()!;
                } else {
                    await new Promise<void>((resolve) => {
                        signalResolver = resolve;
                    });
                }
            }
        },
        async return(): Promise<IteratorResult<T>> {
            return { value: undefined, done: true };
        },
        async throw(e): Promise<IteratorResult<T>> {
            throw e;
        },
        [Symbol.asyncIterator]() {
            return this;
        },
    };

    return stream;

}
