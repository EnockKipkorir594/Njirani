import { z } from 'zod';

export const estateSchema = z.object({
    name : z 
        .string({message: 'Name is required'})
        .min(2, 'Name must at least 2 characters long')
        .max(100, 'Name must be at most 100 characters long')
        .trim(),

    lat : z 
        .number({message:'Latitude is required'})
        .min(-90, 'Latitude must at least -90 degrees')
        .max(90, 'Latitude must be at most 90 degrees'),
    

    lng : z 
        .number({message:'Longitude is required'})
        .min(-180, 'Longitude must at least -180 degrees')
        .max(180, 'Longitude must be at most 180 degrees'),
    
    boundary : z 
        .any()
        .optional(),

    adminId : z
        .string()
        .uuid('Admin ID must be a valid user id'),
    

})


export const listEstatesQuerySchema = z.object({
    page: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z.string().optional().transform((v) => (v ? parseInt(v, 10) : 20)),
    search: z.string().optional(),
});

export type ListstateInput = z.infer< typeof listEstatesQuerySchema >;
export type EstateInput = z.infer< typeof estateSchema>;
