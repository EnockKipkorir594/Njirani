import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL : z 
        .string()
        .min(1, 'DATABASE_URL is required ')
        .refine((url) => url.startsWith('postgresql://'), {
            message: 'DATABASE_URL must start with postgresql://',
        }),

    JWT_SECRET: z 
        .string()
        .min(32, 'JWT_SECRET must be at least 32 characters long'),

    JWT_REFRESH_SECRET: z 
        .string()
        .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),

    PORT : z 
        .string()
        .transform((val) => parseInt(val, 10))
        .pipe(z.number().min(1).max(65535)),

    NODE_ENV : z 
        .enum(['development', 'production', 'test'])
        .default('development'),


    REDIS_URL: z
        .string()
        .startsWith('redis://', 'REDIS_URL must start with redis://')
        .optional(),

    FRONTEND_URL : z 
        .string()
        .url()
        .optional(),
});

//parse and validate 

const parsed = envSchema.safeParse(process.env);

if (!parsed.success){
    console.error('Invalid environment variables');
    parsed.error.issues.forEach((err) => {
        console.error(`  → ${err.path.join('.')}: ${err.message}`);
    });

    process.exit(1);
}

export const env = parsed.data;

//Infer the Typescript type from the schema
export type Env = z.infer<typeof envSchema>;
