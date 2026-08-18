import { ProviderInput } from "./providers.schema.js";
import prisma from "../../config/database.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors.js";


export async function createProviderProfile(
    userId : string, 
    providerData : ProviderInput
){
    //check if user actully exists using userId
    const user = await prisma.user.findUnique({
        where : {
            id : userId,
        }
    })

    //if user does not exist throw not found error 
    if(!user) {
        throw new NotFoundError('User not found')
    }

    //verify user role if they are 'PROVIDER'
    if (user.role !== 'PROVIDER'){
        throw new ForbiddenError('Only proiders can create provider profiles')
    }

    //check if provider profile already exists 

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