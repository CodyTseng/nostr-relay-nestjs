import { ClientException } from './client.exception';

export class RestrictedException extends ClientException {
  super(message: string) {
    this.message = 'restricted: ' + message;
  }
}
