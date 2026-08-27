import { describe, it, expect, beforeAll, afterAll } from "vitest";
import  request  from "supertest";
import { createTestApp } from "../../tests/helpers/app.js";
import prisma from "../../config/database.js";
import { signAccessToken } from "../../utils/jwt.js";
import { cleanDatabase } from "../../tests/helpers/cleanup.js";

const app = createTestApp()

let adminToken: string ;
let adminId : string ;

const estatePayload = {
    name: 'Kilimani Heights',
    lat: -1.2921, 
    lng: 36.8219,  // PostGIS Point
    boundary: {
        type: 'Polygon',
        coordinates: [[
        [36.8210, -1.2915],
        [36.8228, -1.2915],
        [36.8228, -1.2927],
        [36.8210, -1.2927],
        [36.8210, -1.2915]
        ]]
    },

}

// Setup and teardown 
beforeAll( async() => {
    // clean up the database in order: estate referenes user (FK)
    await cleanDatabase()

    //create a real admin user(FK user requires a valid userIdd)

    const admin = await prisma.user.create({
        data:{
            name: 'Estate Admin',
            email: 'admin-estate@njirani.co.ke',
            phone: '+254700000001',
            passwordHash: 'dummyhashfortests',
            role: 'ADMIN',
        }
    })

    adminId = admin.id
    adminToken = signAccessToken({ userId: admin.id , role: admin.role})
})

afterAll( async() => {
    // clean the database after all the tests finish 
    await prisma.estate.deleteMany()
    await prisma.user.deleteMany()
    await prisma.$disconnect()

})


describe('POST /api/v1/estates/create', () => {
    it('Creates new estate and returns 201', async () => {
        const response = await request(app)
            .post('/api/v1/estates/create')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ ...estatePayload, adminId})

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.data.name).toBe('Kilimani Heights')
            
    })
    it('returns 409 when estate name already exists', async () => {
        const response = await request(app)
            .post('/api/v1/estates/create')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ ...estatePayload, adminId})

        expect(response.status).toBe(409)
        expect(response.body.success).toBe(false)

    })
    it ('returns 400 when required fields are missing', async () =>{
        const response = await request(app)
            .post('/api/v1/estates/create')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Kilimani Heights',
                // missing required location field 
                boundary: estatePayload.boundary,
                adminId

            })
        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    
})

// Get estates 
describe('GET /api/v1/estates/list', () => {
    it('returns a list of estates with pagination', async () => {
         // Seed an estate first
        await prisma.estate.create({
            data: {
            name: 'Westlands View',
            boundary: estatePayload.boundary,
            adminId,
            },
        })

        const response = await request(app)
            .get('/api/v1/estates/list')
            .query({ page: '1', limit: '10' });
  
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        // Robust: check the array contains BOTH estates, not index 0
        const names = response.body.data.map((e: any) => e.name)
        expect(names).toContain('Kilimani Heights')   // from the POST test
        expect(names).toContain('Westlands View')      // from this seed
    
        expect(response.body.meta).toMatchObject({
            page: 1,
            limit: 10,
            total: expect.any(Number),
            totalPages: expect.any(Number),
      });
    });
  
    it('filters estates by search query', async () => {
        const response = await request(app)
            .get('/api/v1/estates/list')
            .query({ search: 'Kilimani' });
  
        expect(response.status).toBe(200);
        expect(response.body.data.length).toBe(1);
        expect(response.body.data[0].name).toBe('Kilimani Heights');
    });
  

    it('returns empty array when no estates match', async () => {
        const response = await request(app)
            .get('/api/v1/estates/list')
            .query({ search: 'NonExistentEstate12345' });
  
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
        expect(response.body.meta.total).toBe(0);
    });

});

