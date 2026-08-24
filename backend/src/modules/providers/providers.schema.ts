import { z } from 'zod';

export const providerSchema  = z.object({
    categoryId : z 
        .string({message: 'categoryId is required'}).uuid(),

    bio : z 
        .string()
        .min(10, 'bio must have a minimum of 10 characters')
        .max(250, 'bio must have a maximum of 250 characters')
        .optional(),

    serviceRadiusKm : z 
        .number()
        .min(1, 'Minimum radius is 1km')
        .max(25, 'Maximum radius is 25km')
        .default(5),

    availability : z 
        .any()
        .optional(),


});

export type ProviderInput = z.infer<typeof providerSchema>;


// NEW: List query schema
export const listProvidersQuerySchema = z.object({
    categoryId: z.string().uuid().optional(),
    categorySlug: z.string().optional(),
    search: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v, 10) : 20)),
    sortBy: z.enum(['rating', 'newest']).optional().default('newest'),
  });
  
  export type ListProvidersQuery = z.infer<typeof listProvidersQuerySchema>;
    

    
    


        

