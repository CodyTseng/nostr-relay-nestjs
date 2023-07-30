import { ZodError } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { ClientException } from './client.exception';

export class ValidationException extends ClientException {
  constructor(zodError: ZodError) {
    super(
      fromZodError(zodError, { prefix: 'invalid', maxIssuesInMessage: 1 })
        .message,
    );
  }
}
