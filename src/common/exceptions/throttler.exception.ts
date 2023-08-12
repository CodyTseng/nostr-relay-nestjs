import { ClientException } from './client.exception';

export class ThrottlerException extends ClientException {
  constructor() {
    super('rate-limited: slow down there chief');
  }
}
