import prisma from "../../config/database.js";
import { EstateInput } from "./estates.schema.js";
import { ConflictError, UnauthorizedError } from "../../utils/errors.js";


export async function createEstate(data: EstateInput){

    //check whether the user is an admin with role ['ADMIN]
    const admin = await prisma.user.findFirst({
        where: { 
            id : data.adminId,
            role : 'ADMIN'
        }
    });
    //throw an error if the user is not an admin 
    if (!admin) {
        throw new UnauthorizedError('Only admins can create estates')
    }

    //perform a check to confirm if the estate name alread exists
    const existingEstate = await prisma.estate.findFirst({
        where: {name : data.name},
    })
    // if the estate already exists throw error 
    if (existingEstate){
        throw new ConflictError('Estate already exists')
    }

    //creates the estate if user is an admin 
    const estate = await prisma.estate.create({
        data: {
            name: data.name,
            boundary: data.boundary ?? null ,
            adminId : data.adminId
        },

    });

    //if the fields lat ad lng exist   execute the raw query
    if (data.lat !== undefined && data.lng !== undefined){
        await prisma.$executeRaw`
            UPDATE estates 
            SET location = ST_SetSRID(ST_MakePoint(${data.lng}, ${data.lat}), 4326)
            WHERE id = ${estate.id}
        `
    }

    //return estae id 
    return prisma.estate.findUnique({
        where: { id : estate.id}
    }) ;
}

export async function getEstates(filters: {
    page?: number;
    limit?: number;
    search?: string;
}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.search) {
        where.name = { contains: filters.search, mode: 'insensitive' };
    }

    const [estates, total] = await Promise.all([
        prisma.estate.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.estate.count({ where }),
    ]);

    return {
        estates,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

