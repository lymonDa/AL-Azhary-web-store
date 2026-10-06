import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
    name: string;
    phone: string;
}, {
    password: string;
    email: string;
    name: string;
    phone: string;
}>;
export declare const loginSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    identifier: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}, {
    password: string;
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}>, {
    password: string;
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}, {
    password: string;
    identifier?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
}>;
export declare const verifyEmailSchema: z.ZodObject<{
    token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
}, {
    token: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token: string;
    newPassword: string;
}, {
    token: string;
    newPassword: string;
}>;
export declare const logoutSchema: z.ZodObject<{
    all: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    all: boolean;
}, {
    all?: boolean | undefined;
}>;
