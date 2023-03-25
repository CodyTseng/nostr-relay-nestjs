import { ZodValidationPipe } from '.';
import { REGULAR_EVENT } from '../../../seeds';
import { EventSchema } from '../../nostr/schemas';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(EventSchema);

  it('should pase validate', async () => {
    const validatedEvent = await pipe.transform(REGULAR_EVENT);

    expect(validatedEvent).toEqual(REGULAR_EVENT);
  });

  it('should throw error', async () => {
    await expect(pipe.transform({})).rejects.toThrowError();
  });
});
