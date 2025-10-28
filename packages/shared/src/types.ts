import { z } from 'zod';

// Common schemas and types
export const FileSchema = z.object({
  path: z.string(),
  name: z.string(),
  size: z.number(),
  mimeType: z.string().optional(),
});

export type FileInfo = z.infer<typeof FileSchema>;
