import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';
import { BadRequestException } from '@nestjs/common';

describe('ZodValidationPipe', () => {
  const schema = z.object({
    test: z.string(),
  });
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe(schema);
  });

  it('should return parsed value', () => {
    const value = { test: 'test' };
    expect(pipe.transform(value)).toEqual(value);
  });

  it('should throw BadRequestException on error', () => {
    const value = { test: 1 };
    expect(() => pipe.transform(value)).toThrow(BadRequestException);
  });
});
