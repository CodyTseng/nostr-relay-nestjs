import { Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  async transform(value: unknown) {
    try {
      return await this.schema.parseAsync(value);
    } catch (error) {
      throw fromZodError(error, { prefix: 'invalid', maxIssuesInMessage: 1 });
    }
  }
}
