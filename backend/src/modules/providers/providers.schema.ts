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
export const listProvidersQuerySchema = z
  .object({
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

    sortBy: z
      .enum(['rating', 'newest'])
      .optional()
      .default('newest'),

    // Geographic search parameters
    lat: z
      .string()
      .optional()
      .transform((v) => (v !== undefined ? Number(v) : undefined))
      .pipe(
        z
          .number()
          .min(-90, 'Latitude must be at least -90 degrees')
          .max(90, 'Latitude must be at most 90 degrees')
          .optional()
      ),

    lng: z
      .string()
      .optional()
      .transform((v) => (v !== undefined ? Number(v) : undefined))
      .pipe(
        z
          .number()
          .min(-180, 'Longitude must be at least -180 degrees')
          .max(180, 'Longitude must be at most 180 degrees')
          .optional()
      ),

    radiusKm: z
      .string()
      .optional()
      .transform((v) => (v !== undefined ? Number(v) : 5))
      .pipe(
        z
          .number()
          .min(1, 'Minimum search radius is 1km')
          .max(25, 'Maximum search radius is 25km')
      ),
  })
  .superRefine((data, ctx) => {
    const hasLat = data.lat !== undefined;
    const hasLng = data.lng !== undefined;

    if (hasLat !== hasLng) {
      ctx.addIssue({
        code: 'custom',
        path: ['lat'],
        message: 'Latitude and longitude must be provided together',
      });
    }
  });
  
  export type ListProvidersQuery = z.infer<typeof listProvidersQuerySchema>;
    

    
    


        

