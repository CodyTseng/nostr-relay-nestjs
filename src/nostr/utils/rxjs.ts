import { Observable } from 'rxjs';

export async function observableToArray<T>(
  observableOrPromise: Observable<T> | Promise<Observable<T>>,
): Promise<T[]> {
  const $ =
    observableOrPromise instanceof Promise
      ? await observableOrPromise
      : observableOrPromise;
  return new Promise((resolve, reject) => {
    const array: T[] = [];
    $.subscribe({
      next: (item) => array.push(item),
      complete: () => resolve(array),
      error: reject,
    });
  });
}
