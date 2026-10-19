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
        .url('REDIS_URL must be a valid URL')
        .refine((url) => url.startsWith('redis://'), {
            message: 'REDIS_URL must start with redis://',
        })
        .default('redis://localhost:6379'),

    SMTP_HOST: z.string().min(1).default('localhost'),

    SMTP_PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(1025),
    
    SMTP_SECURE: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
    
    SMTP_FROM: z
        .string()
        .email('SMTP_FROM must be a valid email address')
        .default('notifications@njirani.local'),
    
    SMTP_USER: z.string().min(1).optional(),
    
    SMTP_PASSWORD: z.string().min(1).optional(),

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
