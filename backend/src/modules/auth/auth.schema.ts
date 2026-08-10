import { z } from "zod";

export const registerSchema = z.object ({
    name: z
        .string({ message : 'Name is required'})
        .min(2,"Name must be at least 2 characters ")
        .max(100, "Name must be at most 100 characters")
        .trim(),

    email: z
        .string({ message: 'Email is required'})
        .trim()
        .min(2,'Email must be at least 2 characters')
        .email('Invalid email address')
        .toLowerCase(),

    password: z 
        .string({message: 'Password required'})
        .min(8, "Password must be at least 8 characters long")
        .max(128, 'Password must be at most 128 characters'),

    phone: z
        .string({ message: 'Phone number required'})
        .trim()
        .min(10, 'Phone number must be at least 10 characters')
        .max(15, 'Phone number must be at most 15 characaters'),

    role: z 
        .enum(['ADMIN','PROVIDER','RESIDENT'], { message: 'Role is required',
            
            }),

})

export const LoginSchema = z.object({
    email: z 
        .string({message:'Email is required'})
        .email('Invalid email address')
        .trim()
        .min(2, 'Email must be at least 2 characters long')
        .toLowerCase(),

    password: z 
        .string({message: 'Password is required'})

})

//Infer the Typescript from the schema 
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;


