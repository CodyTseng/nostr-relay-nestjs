import { ZodValidationPipe } from '.';
import { REGULAR_EVENT_DTO } from '../../../seeds';
import { EventDtoSchema } from '../../nostr/schemas';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(EventDtoSchema);

  it('should pase validate', async () => {
    const validatedEvent = await pipe.transform(REGULAR_EVENT_DTO);

    expect(validatedEvent).toEqual(REGULAR_EVENT_DTO);
  });

  it('should throw error', async () => {
    await expect(pipe.transform({})).rejects.toThrowError();
  });
});
