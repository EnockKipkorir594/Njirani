import { ProviderInput } from "./providers.schema.js";
import { Prisma } from "../../generated/prisma/index.js";
import prisma from "../../config/database.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors.js";


export async function createProviderProfile(
    userId : string, 
    providerData : ProviderInput
){
    //check if user actually exists using userId
    const user = await prisma.user.findUnique({
        where : {
            id : userId,
        }
    })

    //if user does not exist throw not found error 
    if(!user) {
        throw new NotFoundError('User not found')
    }

    //verify user role if they are a 'PROVIDER'
    if (user.role !== 'PROVIDER'){
        throw new ForbiddenError('Only proiders can create provider profiles')
    }

    //check if provider  profile already exists 
    const existingProfile = await prisma.providerProfile.findUnique({
        where : {
            id: userId,
        },
    })

    if (existingProfile){
        throw new ConflictError('Provider profile alread exists')
    }

    //check if the service category exists 
    const category = await prisma.serviceCategory.findUnique({
        where: {
            id : providerData.categoryId
        }
    })

    //If category does not exist throw a not found error
    if (!category) {
        throw new NotFoundError('service category not found ')
    }

    const createdProfile = await prisma.providerProfile.create({
        data : {
            userId,
            categoryId : providerData.categoryId, 
            bio : providerData.bio,
            serviceRadiusKm: providerData.serviceRadiusKm,
            availability : providerData.availability

        }, 
        include : {
            user : {
                select:{
                    id: true,
                    name: true,
                    role: true
                }
            },
            category: {
                select:{
                    id: true,
                    name: true,
                    slug: true
                },
            },
        },
    });

    return createdProfile;

}

export async function listProviderProfiles(filters: {
    categoryId?: string;
    categorySlug?: string;
    search?:string;
    page?:number;
    limit?:number;
    sortBy?: 'rating' | 'newest';


}){
    const page = Math.max(1, filters.page ?? 1)
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20))
    const skip = (page - 1) * limit 

    //Build the where clause dynamically
    const where: Prisma.ProviderProfileWhereInput = {}

    if (filters.categoryId) {
        where.categoryId = filters.categoryId
    }
    if (filters.categorySlug) {
        where.category = {
          slug: filters.categorySlug,
        }
      }

    if (filters.search){
        where.OR = [
            {bio: {contains: filters.search, mode: 'insensitive'}},
            {user: {name: {contains: filters.search, mode: 'insensitive'}}},
        ];
    }

    //sorting 
    const orderBy = filters.sortBy === 'rating'
        ? {ratingCached: 'desc' as const}
        : {createdAt: 'desc' as const}


    //Run both queries in parallel 
    const [profiles, total] = await Promise.all([
        prisma.providerProfile.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include:{
                user:{
                    select:{
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }  
                },

                category:{
                    select:{
                        id: true,
                        name: true,
                        slug: true
                        },
                    
                },
            
            }
        }),
        prisma.providerProfile.count({where})
    ]);

    return {
        profiles,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };


}

    
