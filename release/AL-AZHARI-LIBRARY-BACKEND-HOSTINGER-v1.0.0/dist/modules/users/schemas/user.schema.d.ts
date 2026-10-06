import { z } from 'zod';
export declare const updateProfileSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    email: z.ZodOptional<z.ZodNever>;
}, "strict", z.ZodTypeAny, {
    email?: undefined;
    name?: string | undefined;
    phone?: string | undefined;
}, {
    email?: undefined;
    name?: string | undefined;
    phone?: string | undefined;
}>, {
    email?: undefined;
    name?: string | undefined;
    phone?: string | undefined;
}, {
    email?: undefined;
    name?: string | undefined;
    phone?: string | undefined;
}>;
export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
