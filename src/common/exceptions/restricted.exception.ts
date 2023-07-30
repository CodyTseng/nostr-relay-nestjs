import { ClientException } from './client.exception';

export class RestrictedException extends ClientException {
  constructor(message: string) {
    super('restricted: ' + message);
  }
}
