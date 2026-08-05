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
        .min(2,'Email must be at least 2 characters ')
        .email('Invalid email address')
        .toLowerCase(),

    password: z 
        .string({message: 'Password required'})
        .min(8, "Password must have a minimum of  8 characters")
        .max(128, 'Password must be at most 128 characters'),

    phone: z
        .string({ message: 'Phone number required'})
        .trim()
        .min(10, 'Phone number should a minimum of 10 characters')
        .max(15, 'Phone number must be at most 15 characaters'),

    role: z 
        .enum(['ADMIN','PROVIDER','RESIDENT'], { message: 'Role is required',
            
            }),

})

export type RegisterInput = z.infer<typeof registerSchema>;
