import { z } from 'zod';

export const EnvironmentSchema = z.object({
  LOG_DIR: z.string().optional(),
  LOG_LEVEL: z.string().optional(),

  RELAY_NAME: z.string().optional(),
  RELAY_DESCRIPTION: z.string().optional(),
  RELAY_PUBKEY: z
    .string()
    .regex(/^[0-9a-f]+$/)
    .length(64)
    .optional(),
  RELAY_CONTACT: z.string().optional(),
  RELAY_SUPPORTED_NIPS: z.array(z.number().int()).optional(),
});
export type Environment = z.infer<typeof EnvironmentSchema>;

export function validateEnvironment(env: Record<string, unknown>) {
  return EnvironmentSchema.parse(env);
}
