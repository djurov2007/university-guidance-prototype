import { z } from "zod";

const serverConfigSchema = z
  .object({
    APP_MODE: z.literal("mock").default("mock"),
  })
  .strict();

export function parseServerConfig(input: { APP_MODE?: string | undefined }) {
  const parsed = serverConfigSchema.safeParse(input);
  if (!parsed.success) {
    // Never include the submitted value or a raw Zod error in logs/responses.
    throw new Error("Invalid server configuration. APP_MODE must be mock.");
  }
  return { mode: parsed.data.APP_MODE } as const;
}
