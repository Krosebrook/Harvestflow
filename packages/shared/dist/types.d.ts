import { z } from 'zod';
export declare const FileSchema: z.ZodObject<{
    path: z.ZodString;
    name: z.ZodString;
    size: z.ZodNumber;
    mimeType: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type FileInfo = z.infer<typeof FileSchema>;
//# sourceMappingURL=types.d.ts.map