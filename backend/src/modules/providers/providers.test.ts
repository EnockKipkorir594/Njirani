import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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
});