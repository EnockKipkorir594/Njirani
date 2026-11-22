import { describe, it, expect, beforeAll, afterAll } from "vitest";
import  request  from "supertest";
import { createTestApp } from "../../tests/helpers/app.js";
import prisma from "../../config/database.js";
import { signAccessToken } from "../../utils/jwt.js";
import { cleanDatabase } from "../../tests/helpers/cleanup.js";

const app = createTestApp()

let adminToken: string ;
let adminId : string ;

let residentToken: string;
let residentId: string;

let secondResidentToken: string;
let secondResidentId: string;

let assignmentEstateId: string;

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

    // Create residents for estate-assignment tests.
    const resident = await prisma.user.create({
        data: {
            name: 'Estate Test Resident',
            email: 'resident-estate@njirani.co.ke',
            phone: '+254700000002',
            passwordHash: 'dummyhashfortests',
            role: 'RESIDENT',
        },
    });

    residentId = resident.id;
    residentToken = signAccessToken({
        userId: resident.id,
        role: resident.role,
    });

    const secondResident = await prisma.user.create({
        data: {
            name: 'Second Estate Test Resident',
            email: 'resident-estate-2@njirani.co.ke',
            phone: '+254700000003',
            passwordHash: 'dummyhashfortests',
            role: 'RESIDENT',
        },
    });

    secondResidentId = secondResident.id;
    secondResidentToken = signAccessToken({
        userId: secondResident.id,
        role: secondResident.role,
    });

    // Create an estate specifically for assignment tests.
    const assignmentEstate = await prisma.estate.create({
        data: {
            name: 'Rongai Assignment Estate',
            adminId,
        },
    });

    assignmentEstateId = assignmentEstate.id;

})

afterAll( async() => {
    // clean the database after all the tests finish 
    await prisma.user.deleteMany();
    await prisma.estate.deleteMany();
    await prisma.$disconnect();

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
        const names = response.body.data.map((e: { name: string }) => e.name)
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


describe('PATCH /api/v1/estates/me', () => {
    it('returns 401 when the user is unauthenticated', async () => {
        const response = await request(app)
            .patch('/api/v1/estates/me')
            .send({ estateId: assignmentEstateId });

        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });

    it('returns 403 when an admin attempts resident estate assignment', async () => {
        const response = await request(app)
            .patch('/api/v1/estates/me')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ estateId: assignmentEstateId });

        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    it('returns 400 when estateId is invalid', async () => {
        const response = await request(app)
            .patch('/api/v1/estates/me')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ estateId: 'not-a-valid-uuid' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('rejects additional client-controlled fields', async () => {
        const response = await request(app)
            .patch('/api/v1/estates/me')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({
                estateId: assignmentEstateId,
                residentId: secondResidentId,
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    it('returns 404 when the selected estate does not exist', async () => {
        const response = await request(app)
            .patch('/api/v1/estates/me')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({
                estateId: '00000000-0000-4000-8000-000000000000',
            });

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });

    it('assigns the authenticated resident to the selected estate', async () => {
        const response = await request(app)
            .patch('/api/v1/estates/me')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ estateId: assignmentEstateId });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(residentId);
        expect(response.body.data.estateId).toBe(assignmentEstateId);
        expect(response.body.data.estate.name).toBe(
            'Rongai Assignment Estate'
        );

        const updatedResident = await prisma.user.findUnique({
            where: { id: residentId },
            select: { estateId: true },
        });

        expect(updatedResident?.estateId).toBe(assignmentEstateId);
    });

    it('prevents an already assigned resident from changing estates', async () => {
        const response = await request(app)
            .patch('/api/v1/estates/me')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ estateId: assignmentEstateId });

        expect(response.status).toBe(409);
        expect(response.body.success).toBe(false);
    });

    it('allows only one of two concurrent assignment requests to succeed', async () => {
        const responses = await Promise.all([
            request(app)
                .patch('/api/v1/estates/me')
                .set('Authorization', `Bearer ${secondResidentToken}`)
                .send({ estateId: assignmentEstateId }),

            request(app)
                .patch('/api/v1/estates/me')
                .set('Authorization', `Bearer ${secondResidentToken}`)
                .send({ estateId: assignmentEstateId }),
        ]);

        const statuses = responses
            .map((response) => response.status)
            .sort((a, b) => a - b);

        expect(statuses).toEqual([200, 409]);

        const updatedResident = await prisma.user.findUnique({
            where: { id: secondResidentId },
            select: { estateId: true },
        });

        expect(updatedResident?.estateId).toBe(assignmentEstateId);
    });
});