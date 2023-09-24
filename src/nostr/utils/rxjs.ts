import { Observable, firstValueFrom, toArray } from 'rxjs';

export async function observableToArray<T>(obs: Observable<T>): Promise<T[]> {
  return firstValueFrom(obs.pipe(toArray()));
}
