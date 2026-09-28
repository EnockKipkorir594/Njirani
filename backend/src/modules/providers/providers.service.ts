import { ProviderInput } from "./providers.schema.js";
import { Prisma } from "../../generated/prisma/index.js";
import prisma from "../../config/database.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors.js";
import {
    findProvidersWithinRadius,
    type NearbyProvider,
} from "../geospatial/geospatial.service.js";


export async function createProviderProfile(
    userId : string, 
    providerData : ProviderInput
){
    //check if user actually exists using userId
    const user = await prisma.user.findUnique({
        where : {
            id:userId,
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

    //check if provider  profile already exists 
    const existingProfile = await prisma.providerProfile.findUnique({
        where : {
            userId,
        },
    })

    if (existingProfile){
        throw new ConflictError('Provider profile alread exists')
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
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'rating' | 'newest' | 'distance';
    lat?: number;
    lng?: number;
    radiusKm?: number;
}) {
    const page = Math.max(1, filters.page ?? 1);
    const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProviderProfileWhereInput = {};

    let nearbyProviders: NearbyProvider[] | undefined;

    // ---------------------------------------------------------
    // 1. GEO FILTERING
    // ---------------------------------------------------------
    if (filters.lat !== undefined && filters.lng !== undefined) {
        nearbyProviders = await findProvidersWithinRadius(
            filters.lat,
            filters.lng,
            filters.radiusKm ?? 5,
        );

        const nearbyProviderIds = nearbyProviders.map(
            (provider) => provider.id,
        );

        where.id = {
            in: nearbyProviderIds,
        };
    }

    // ---------------------------------------------------------
    // 2. CATEGORY FILTERING
    // ---------------------------------------------------------
    if (filters.categoryId) {
        where.categoryId = filters.categoryId;
    }

    if (filters.categorySlug) {
        where.category = {
            slug: filters.categorySlug,
        };
    }

    // ---------------------------------------------------------
    // 3. SEARCH FILTERING
    // ---------------------------------------------------------
    if (filters.search) {
        where.OR = [
            {
                bio: {
                    contains: filters.search,
                    mode: 'insensitive',
                },
            },
            {
                user: {
                    name: {
                        contains: filters.search,
                        mode: 'insensitive',
                    },
                },
            },
        ];
    }

    // ---------------------------------------------------------
    // 4. PROVIDER INCLUDE
    // ---------------------------------------------------------
    const include = {
        user: {
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
            },
        },
        category: {
            select: {
                id: true,
                name: true,
                slug: true,
            },
        },
    };

    // ---------------------------------------------------------
    // 5. DISTANCE SORTING
    // ---------------------------------------------------------
    if (filters.sortBy === 'distance') {
        /*
         * The distance does not exist as a Prisma column.
         * It comes from PostGIS through nearbyProviders.
         *
         * Therefore we cannot use Prisma's orderBy here.
         * Instead:
         *
         * 1. Fetch the matching provider profiles.
         * 2. Build a map by provider ID.
         * 3. Walk through nearbyProviders in its distance order.
         * 4. Attach distanceKm.
         * 5. Apply pagination after sorting.
         */

        const [profiles, total] = await Promise.all([
            prisma.providerProfile.findMany({
                where,
                include,
            }),
            prisma.providerProfile.count({
                where,
            }),
        ]);

        const profilesById = new Map(
            profiles.map((profile) => [profile.id, profile]),
        );

        const orderedProfiles =
            nearbyProviders?.flatMap((nearbyProvider) => {
                const profile = profilesById.get(nearbyProvider.id);

                if (!profile) {
                    return [];
                }

                return [
                    {
                        ...profile,
                        distanceKm: nearbyProvider.distanceKm,
                    },
                ];
            }) ?? [];

        const paginatedProfiles = orderedProfiles.slice(
            skip,
            skip + limit,
        );

        return {
            profiles: paginatedProfiles,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // ---------------------------------------------------------
    // 6. NORMAL SORTING
    // ---------------------------------------------------------
    const orderBy =
        filters.sortBy === 'rating'
            ? { ratingCached: 'desc' as const }
            : { createdAt: 'desc' as const };

    const [profiles, total] = await Promise.all([
        prisma.providerProfile.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include,
        }),
        prisma.providerProfile.count({
            where,
        }),
    ]);

    // ---------------------------------------------------------
    // 7. ATTACH DISTANCE WHEN GEO SEARCH IS USED
    // ---------------------------------------------------------
    const distanceMap = new Map(
        (nearbyProviders ?? []).map((provider) => [
            provider.id,
            provider.distanceKm,
        ]),
    );

    const profilesWithDistance =
        nearbyProviders !== undefined
            ? profiles.map((profile) => ({
                  ...profile,
                  distanceKm: distanceMap.get(profile.id) ?? null,
              }))
            : profiles;

    return {
        profiles: profilesWithDistance,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}