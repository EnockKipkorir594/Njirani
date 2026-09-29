import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../../tests/helpers/app.js'
import prisma from '../../config/database.js'
import { signAccessToken } from '../../utils/jwt.js'


const app = createTestApp()

let providerId: string;
let providerToken: string;
let residentToken: string;
let categoryId: string;


const timestamp = Date.now()
const PROVIDER_EMAIL = `provider-${timestamp}@njirani.co.ke`
const RESIDENT_EMAIL = `resident-${timestamp}@njirani.co.ke`

const providerPayload = {
    categoryId: 'dummyid123',
    bio:'Experienced plumber with 5 years in residential work',
    serviceRadiusKm: 9,
    availability:  { monday: ['09:00-17:00'], tuesday: ['09:00-17:00'] }

}

beforeAll( async () => {
    await prisma.providerProfile.deleteMany()
    await prisma.user.deleteMany()
    await prisma.estate.deleteMany()
    await prisma.serviceCategory.deleteMany()



    const category = await prisma.serviceCategory.create({
        data:{
            name:'Plumbing',
            slug:'plumbing',
            icon:'wrench'
            
        }
    })

    categoryId = category.id
    providerPayload.categoryId = categoryId


    const provider = await prisma.user.create({
        data:{
            name: 'Estate Resident',
            email: PROVIDER_EMAIL,
            phone: '+254700000301',
            passwordHash: 'dummyhashfortests',
            role: 'PROVIDER',

        }
    })

    providerId = provider.id
    providerToken = signAccessToken({ userId: provider.id, role: provider.role})

    const resident = await prisma.user.create({
        data:{
            name: 'Estate Resident',
            email: RESIDENT_EMAIL,
            phone: '+254700000201',
            passwordHash: 'dummyhashfortests',
            role: 'RESIDENT',

        }
    })

    
    residentToken = signAccessToken({ userId: resident.id, role: resident.role})

})

afterAll( async () => {
    await prisma.providerProfile.deleteMany()
    await prisma.user.deleteMany()
    await prisma.serviceCategory.deleteMany()
    await prisma.$disconnect()

})

//Create provider profile 
describe('POST /api/v1/providers/create', () => {
    it('creates new provider profile and returns 201', async () => {
        const response = await request(app)
            .post('/api/v1/providers/create')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({ ...providerPayload, categoryId})

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.data.bio).toBe('Experienced plumber with 5 years in residential work')
        expect(response.body.data.userId).toBe(providerId)
        expect(response.body.data.categoryId).toBe(categoryId)

    })

    it('returns 401 without authenticatioon', async () => {
        const response = await request(app)
            .post('/api/v1/providers/create')
            .send({ ...providerPayload, categoryId })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)

    })

    it('returns 403 when user is not a provider', async () => {
        const response = await request(app)
            .post('/api/v1/providers/create')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ ...providerPayload, categoryId})


        expect(response.status).toBe(403)
        expect(response.body.success).toBe(false)
    })

    it('returns 409 when provider profile  already exists', async () => {
        const response = await request(app)
            .post('/api/v1/providers/create')
            .set('Authorization', `Bearer ${providerToken}`)
            .send(providerPayload)

        expect(response.status).toBe(409)
        expect(response.body.success).toBe(false)

    })
    it ('returns 404 when category does not exist', async () =>{
        const response = await request(app)
            .post('/api/v1/providers/create')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({
                ...providerPayload,
                categoryId: '00000000-0000-0000-0000-000000000000'

            })
        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
    })
})

describe('PATCH /api/v1/providers/:id', () => {
    let editProviderId: string;
    let editProviderToken: string;
    let editProviderProfileId: string;

    let otherProviderId: string;
    let otherProviderToken: string;

    let updatedCategoryId: string;

    const ORIGINAL_BIO =
        'Original provider bio with enough length';

    const ORIGINAL_SERVICE_RADIUS = 5;

    const ORIGINAL_AVAILABILITY = {
        monday: ['09:00-17:00'],
        tuesday: ['09:00-17:00'],
    };

    beforeAll(async () => {
        // ------------------------------------------------------------
        // 1. Create a dedicated provider specifically for PATCH tests
        // ------------------------------------------------------------
        const editProvider = await prisma.user.create({
            data: {
                name: 'Provider Edit Test User',
                email: `provider-edit-${Date.now()}@njirani.co.ke`,
                phone: `+254700${Date.now().toString().slice(-6)}`,
                passwordHash: 'dummyhashfortests',
                role: 'PROVIDER',
            },
        });

        editProviderId = editProvider.id;

        editProviderToken = signAccessToken({
            userId: editProvider.id,
            role: editProvider.role,
        });

        // ------------------------------------------------------------
        // 2. Create the provider profile being edited
        // ------------------------------------------------------------
        const profile = await prisma.providerProfile.create({
            data: {
                userId: editProvider.id,
                categoryId,
                bio: ORIGINAL_BIO,
                serviceRadiusKm: ORIGINAL_SERVICE_RADIUS,
                availability: ORIGINAL_AVAILABILITY,
            },
        });

        editProviderProfileId = profile.id;

        // ------------------------------------------------------------
        // 3. Create a second category for category-update testing
        // ------------------------------------------------------------
        const updatedCategory = await prisma.serviceCategory.create({
            data: {
                name: `Electrical Editing Test ${Date.now()}`,
                slug: `electrical-editing-test-${Date.now()}`,
                icon: 'bolt',
            },
        });

        updatedCategoryId = updatedCategory.id;

        // ------------------------------------------------------------
        // 4. Create another provider for ownership testing
        // ------------------------------------------------------------
        const otherProvider = await prisma.user.create({
            data: {
                name: 'Other Edit Provider',
                email: `other-edit-provider-${Date.now()}@njirani.co.ke`,
                phone: `+254799${Date.now().toString().slice(-6)}`,
                passwordHash: 'dummyhashfortests',
                role: 'PROVIDER',
            },
        });

        otherProviderId = otherProvider.id;

        otherProviderToken = signAccessToken({
            userId: otherProvider.id,
            role: otherProvider.role,
        });
    });

    beforeEach(async () => {
        // Reset the profile before every test so tests remain independent.
        await prisma.providerProfile.update({
            where: {
                id: editProviderProfileId,
            },
            data: {
                categoryId,
                bio: ORIGINAL_BIO,
                serviceRadiusKm: ORIGINAL_SERVICE_RADIUS,
                availability: ORIGINAL_AVAILABILITY,
            },
        });
    });

    afterAll(async () => {
        // Delete the dedicated PATCH test profile first.
        await prisma.providerProfile.delete({
            where: {
                id: editProviderProfileId,
            },
        });

        // Then delete the users created by this suite.
        await prisma.user.deleteMany({
            where: {
                id: {
                    in: [editProviderId, otherProviderId],
                },
            },
        });

        // Finally remove the category created specifically for this suite.
        await prisma.serviceCategory.delete({
            where: {
                id: updatedCategoryId,
            },
        });
    });

    it('updates the provider profile and returns 200', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                bio: 'Updated bio: plumber with 10 years experience',
                serviceRadiusKm: 12,
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data.bio).toBe(
            'Updated bio: plumber with 10 years experience',
        );

        expect(response.body.data.serviceRadiusKm).toBe(12);
    });

    it('supports partial updates', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                bio: 'Updated biography only',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data.bio).toBe(
            'Updated biography only',
        );

        // Fields not included in the PATCH request remain unchanged.
        expect(response.body.data.serviceRadiusKm).toBe(
            ORIGINAL_SERVICE_RADIUS,
        );

        expect(response.body.data.categoryId).toBe(categoryId);
    });

    it('updates the provider category', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                categoryId: updatedCategoryId,
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data.categoryId).toBe(
            updatedCategoryId,
        );

        expect(response.body.data.category.id).toBe(
            updatedCategoryId,
        );
    });

    it('updates provider availability', async () => {
        const newAvailability = {
            monday: ['10:00-18:00'],
            wednesday: ['09:00-15:00'],
        };

        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                availability: newAvailability,
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data.availability).toEqual(
            newAvailability,
        );
    });

    it('returns 401 without authentication', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .send({
                bio: 'Should not update without authentication',
            });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);

        const profile = await prisma.providerProfile.findUnique({
            where: {
                id: editProviderProfileId,
            },
        });

        expect(profile?.bio).toBe(ORIGINAL_BIO);
    });

    it('returns 403 when a resident tries to update a provider profile', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${residentToken}`)
            .send({
                bio: 'Resident should not be able to update',
            });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);

        const profile = await prisma.providerProfile.findUnique({
            where: {
                id: editProviderProfileId,
            },
        });

        expect(profile?.bio).toBe(ORIGINAL_BIO);
    });

    it('returns 403 when a provider tries to update another provider profile', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${otherProviderToken}`)
            .send({
                bio: 'Should not be allowed',
            });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);

        const profile = await prisma.providerProfile.findUnique({
            where: {
                id: editProviderProfileId,
            },
        });

        expect(profile?.bio).toBe(ORIGINAL_BIO);
    });

    it('returns 404 when the profile does not exist', async () => {
        const response = await request(app)
            .patch(
                '/api/v1/providers/00000000-0000-0000-0000-000000000000',
            )
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                bio: 'Profile does not exist',
            });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('returns 404 when the category does not exist', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                categoryId:
                    '00000000-0000-0000-0000-000000000000',
            });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('returns 400 when categoryId is not a valid UUID', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                categoryId: 'not-a-valid-uuid',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('returns 400 when serviceRadiusKm exceeds the maximum allowed value', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                serviceRadiusKm: 30,
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('returns 400 when serviceRadiusKm is below the minimum allowed value', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                serviceRadiusKm: 0,
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('returns 400 when bio is too short', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                bio: 'short',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('returns 400 when bio is too long', async () => {
        const response = await request(app)
            .patch(`/api/v1/providers/${editProviderProfileId}`)
            .set('Authorization', `Bearer ${editProviderToken}`)
            .send({
                bio: 'a'.repeat(251),
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});

//list provider profiles tests 
describe('GET /api/v1/providers/list', () => {
    it('returns a list of provider profiles with pagination meta', async () => {
      const response = await request(app)
        .get('/api/v1/providers/list')
        .query({ page: '1', limit: '10' })
  
      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
      expect(response.body.data.length).toBeGreaterThan(0)
      // BUG PREVENTION #4: listProviderProfiles returns { estates, meta }
      // The controller passes meta as the 3rd arg to successResponse
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number)
      })
    })
  
    it('filters by category slug', async () => {
      const response = await request(app)
        .get('/api/v1/providers/list')
        .query({ categorySlug: 'plumbing' })
  
      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0].category.slug).toBe('plumbing')
    })
  
    it('filters by search query on bio', async () => {
      const response = await request(app)
        .get('/api/v1/providers/list')
        .query({ search: 'plumber' })
  
      expect(response.status).toBe(200)
      expect(response.body.data.length).toBeGreaterThan(0)
    })
  
    it('returns empty array when no providers match', async () => {
      const response = await request(app)
        .get('/api/v1/providers/list')
        .query({ search: 'NonExistentProviderXYZ123' })
  
      expect(response.status).toBe(200)
      expect(response.body.data).toEqual([])
      expect(response.body.meta.total).toBe(0)

    })

  })

  describe('GET /api/v1/providers/list - geospatial filtering', () => {
    let geospatialCategoryId: string;

    let nearbyEstateId: string;
    let farEstateId: string;

    let nearbyProviderId: string;
    let farProviderId: string;

    beforeAll(async () => {
        // ------------------------------------------------------------
        // 1. Create a category specifically for geospatial tests
        // ------------------------------------------------------------
        const category = await prisma.serviceCategory.create({
            data: {
                name: 'Geospatial Plumbing',
                slug: 'geospatial-plumbing',
                icon: 'Wrench',
            },
        });

        geospatialCategoryId = category.id;

        // ------------------------------------------------------------
        // 2. Create a nearby estate
        // ------------------------------------------------------------
        const nearbyEstate = await prisma.estate.create({
            data: {
                name: 'Geo Nearby Estate',
                adminId: '00000000-0000-0000-0000-000000000000',
            },
        });

        nearbyEstateId = nearbyEstate.id;

        await prisma.$executeRaw`
            UPDATE estates
            SET location = ST_SetSRID(
                ST_MakePoint(${36.8219}, ${-1.2921}),
                4326
            )
            WHERE id = ${nearbyEstateId}
        `;

        // ------------------------------------------------------------
        // 3. Create a far-away estate
        // ------------------------------------------------------------
        const farEstate = await prisma.estate.create({
            data: {
                name: 'Geo Far Estate',
                adminId: '00000000-0000-0000-0000-000000000000',
            },
        });

        farEstateId = farEstate.id;

        await prisma.$executeRaw`
            UPDATE estates
            SET location = ST_SetSRID(
                ST_MakePoint(${36.9000}, ${-1.3500}),
                4326
            )
            WHERE id = ${farEstateId}
        `;

        // ------------------------------------------------------------
        // 4. Create nearby provider user
        // ------------------------------------------------------------
        const nearbyUser = await prisma.user.create({
            data: {
                name: 'Geo Nearby Provider',
                email: `geo-nearby-${Date.now()}@test.njirani`,
                phone: `+254711${Date.now().toString().slice(-6)}`,
                passwordHash: 'test-hash',
                role: 'PROVIDER',
                estateId: nearbyEstateId,
            },
        });

        // ------------------------------------------------------------
        // 5. Create far provider user
        // ------------------------------------------------------------
        const farUser = await prisma.user.create({
            data: {
                name: 'Geo Far Provider',
                email: `geo-far-${Date.now()}@test.njirani`,
                phone: `+254722${Date.now().toString().slice(-6)}`,
                passwordHash: 'test-hash',
                role: 'PROVIDER',
                estateId: farEstateId,
            },
        });

        // ------------------------------------------------------------
        // 6. Create provider profiles
        // ------------------------------------------------------------
        const nearbyProvider = await prisma.providerProfile.create({
            data: {
                userId: nearbyUser.id,
                categoryId: geospatialCategoryId,
                bio: 'Nearby geospatial plumber',
            },
        });

        nearbyProviderId = nearbyProvider.id;

        const farProvider = await prisma.providerProfile.create({
            data: {
                userId: farUser.id,
                categoryId: geospatialCategoryId,
                bio: 'Far geospatial plumber',
            },
        });

        farProviderId = farProvider.id;

      
    });

    afterAll(async () => {
        // Delete only the fixtures created by this geospatial test suite.
        await prisma.providerProfile.deleteMany({
            where: {
                id: {
                    in: [nearbyProviderId, farProviderId],
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                estateId: {
                    in: [nearbyEstateId, farEstateId],
                },
            },
        });

        await prisma.estate.deleteMany({
            where: {
                id: {
                    in: [nearbyEstateId, farEstateId],
                },
            },
        });

        await prisma.serviceCategory.delete({
            where: {
                id: geospatialCategoryId,
            },
        });

    });

    it('returns providers within the requested radius', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                lat: '-1.2921',
                lng: '36.8219',
                radiusKm: '5',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data).toHaveLength(1);

        expect(response.body.data[0].id).toBe(nearbyProviderId);
        expect(response.body.data[0].id).not.toBe(farProviderId);

        expect(response.body.meta).toMatchObject({
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
        });
    });

    it('uses the default 5km radius when radiusKm is omitted', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                lat: '-1.2921',
                lng: '36.8219',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe(nearbyProviderId);
    });

    it('combines geographic filtering with category filtering', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                categorySlug: 'geospatial-plumbing',
                lat: '-1.2921',
                lng: '36.8219',
                radiusKm: '5',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].id).toBe(nearbyProviderId);
        expect(response.body.data[0].category.slug).toBe(
            'geospatial-plumbing',
        );
    });

    it('returns 400 when latitude and longitude are not provided together', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                lat: '-1.2921',
                radiusKm: '5',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('returns 400 when radius exceeds the maximum allowed value', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                lat: '-1.2921',
                lng: '36.8219',
                radiusKm: '30',
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('returns an empty result when no provider is within the radius', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                lat: '-1.1000',
                lng: '36.5000',
                radiusKm: '1',
            });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.data).toEqual([]);

        expect(response.body.meta).toMatchObject({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
        });
    });

    it('returns distanceKm when geographic filtering is used', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                lat: -1.2921,
                lng: 36.8219,
                radiusKm: 5,
            });
    
        expect(response.status).toBe(200);
    
        expect(response.body.data.length).toBeGreaterThan(0);
    
        expect(response.body.data[0]).toHaveProperty('distanceKm');
        expect(response.body.data[0].distanceKm).toEqual(
            expect.any(Number),
        );
    });

    it('sorts providers by distance when sortBy=distance', async () => {
        // Create a second nearby estate.
        // The existing nearby estate is exactly at the search point (0 km),
        // so this second estate will give us a real distance to compare.
        const secondNearbyEstate = await prisma.estate.create({
            data: {
                name: 'Geo Second Nearby Estate',
                adminId: '00000000-0000-0000-0000-000000000000',
            },
        });
    
        // Roughly 2 km east of the search point.
        await prisma.$executeRaw`
            UPDATE estates
            SET location = ST_SetSRID(
                ST_MakePoint(${36.8420}, ${-1.2921}),
                4326
            )
            WHERE id = ${secondNearbyEstate.id}
        `;
    
        const secondNearbyUser = await prisma.user.create({
            data: {
                name: 'Geo Second Nearby Provider',
                email: `geo-second-nearby-${Date.now()}@test.njirani`,
                phone: `+254733${Date.now().toString().slice(-6)}`,
                passwordHash: 'test-hash',
                role: 'PROVIDER',
                estateId: secondNearbyEstate.id,
            },
        });
    
        const secondNearbyProvider = await prisma.providerProfile.create({
            data: {
                userId: secondNearbyUser.id,
                categoryId: geospatialCategoryId,
                bio: 'Second nearby geospatial plumber',
            },
        });
    
        try {
            const response = await request(app)
                .get('/api/v1/providers/list')
                .query({
                    lat: -1.2921,
                    lng: 36.8219,
                    radiusKm: 5,
                    sortBy: 'distance',
                });
    
            expect(response.status).toBe(200);
    
            const providers = response.body.data;
    
            expect(providers).toHaveLength(2);
    
            expect(providers[0].distanceKm)
                .toBeLessThan(providers[1].distanceKm);
    
            expect(providers[0].id).toBe(nearbyProviderId);
    
            expect(providers[1].id).toBe(secondNearbyProvider.id);
        } finally {
            await prisma.providerProfile.delete({
                where: {
                    id: secondNearbyProvider.id,
                },
            });
    
            await prisma.user.delete({
                where: {
                    id: secondNearbyUser.id,
                },
            });
    
            await prisma.estate.delete({
                where: {
                    id: secondNearbyEstate.id,
                },
            });
        }
    });

    it('returns 400 when sortBy=distance is used without coordinates', async () => {
        const response = await request(app)
            .get('/api/v1/providers/list')
            .query({
                sortBy: 'distance',
            });
    
        expect(response.status).toBe(400);
    });
});