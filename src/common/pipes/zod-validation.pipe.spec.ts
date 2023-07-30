import { z } from 'zod';
import { ValidationException } from '../exceptions';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;
  let schema: z.ZodSchema;

  beforeEach(() => {
    schema = z.object({
      name: z.string(),
      age: z.number(),
    });
    pipe = new ZodValidationPipe(schema);
  });

  describe('transform', () => {
    it('should return the validated value', async () => {
      const value = { name: 'John', age: 30 };
      const result = await pipe.transform(value);
      expect(result).toEqual(value);
    });

    it('should throw a ValidationException if the value is invalid', async () => {
      const value = { name: 'John', age: '30' };
      await expect(pipe.transform(value)).rejects.toThrowError(
        ValidationException,
      );
    });

    it('should throw the original error if it is not a ZodError', async () => {
      const value = { name: 'John', age: 30 };
      const error = new Error('Some error');
      schema.parseAsync = jest.fn().mockRejectedValueOnce(error);
      await expect(pipe.transform(value)).rejects.toThrowError(error);
    });
  });
});
