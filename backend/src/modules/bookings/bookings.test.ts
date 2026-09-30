import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../../tests/helpers/app.js'
import prisma from '../../config/database.js'
import { signAccessToken } from '../../utils/jwt.js'


const app = createTestApp()

let residentId: string;
let residentToken: string;
let providerToken: string;
let providerProfileId: string;
let categoryId: string;
let estateId: string;
let noEstateResidentToken: string;


const timestamp = Date.now()
const PROVIDER_EMAIL = `provider-${timestamp}@njirani.co.ke`
const RESIDENT_EMAIL = `resident-${timestamp}@njirani.co.ke`
const NO_ESTATE_EMAIL = `no-estate-resident-${timestamp}@njirani.co.ke`

const DESCRIPTION = 'The kitchen sink is leaking under the cabinet'
const SCHEDULED_AT = '2026-12-01T09:00:00.000Z'

const bookingPayload = {
    description: DESCRIPTION,
    scheduledAt: SCHEDULED_AT,
}

beforeAll( async () => {
    await prisma.booking.deleteMany()
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

    const estate = await prisma.estate.create({
        data:{
            name: 'Booking Test Estate',
            adminId: '00000000-0000-0000-0000-000000000000',
        }
    })

    estateId = estate.id

    const provider = await prisma.user.create({
        data:{
            name: 'Booking Test Provider',
            email: PROVIDER_EMAIL,
            phone: '+254700000301',
            passwordHash: 'dummyhashfortests',
            role: 'PROVIDER',
        }
    })

    const providerProfile = await prisma.providerProfile.create({
        data:{
            userId: provider.id,
            categoryId,
        }
    })

    providerProfileId = providerProfile.id
    providerToken = signAccessToken({ userId: provider.id, role: provider.role })

    const resident = await prisma.user.create({
        data:{
            name: 'Booking Test Resident',
            email: RESIDENT_EMAIL,
            phone: '+254700000201',
            passwordHash: 'dummyhashfortests',
            role: 'RESIDENT',
            estateId,
        }
    })

    residentId = resident.id
    residentToken = signAccessToken({ userId: resident.id, role: resident.role })

    const noEstateResident = await prisma.user.create({
        data:{
            name: 'Booking Test Resident Without Estate',
            email: NO_ESTATE_EMAIL,
            phone: '+254700000202',
            passwordHash: 'dummyhashfortests',
            role: 'RESIDENT',
        }
    })

    noEstateResidentToken = signAccessToken({ userId: noEstateResident.id, role: noEstateResident.role })

})

afterAll( async () => {
    await prisma.booking.deleteMany()
    await prisma.providerProfile.deleteMany()
    await prisma.user.deleteMany()
    await prisma.estate.deleteMany()
    await prisma.serviceCategory.deleteMany()
    await prisma.$disconnect()

})

//Create booking tests
describe('POST /api/v1/bookings', () => {
    it('creates a new booking and returns 201', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ ...bookingPayload, providerId: providerProfileId })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.data.description).toBe(DESCRIPTION)
        expect(response.body.data.residentId).toBe(residentId)
        expect(response.body.data.categoryId).toBe(categoryId)
        expect(response.body.data.estateId).toBe(estateId)

    })

    it('derives status, paymentStatus and priceQuote server side', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ ...bookingPayload, providerId: providerProfileId })

        expect(response.status).toBe(201)
        expect(response.body.data.status).toBe('PENDING')
        expect(response.body.data.paymentStatus).toBe('PENDING')
        expect(response.body.data.priceQuote).toBeNull()

    })

    it('returns 401 without authentication', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .send({ ...bookingPayload, providerId: providerProfileId })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('returns 403 when user is not a resident', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${providerToken}`)
            .send({ ...bookingPayload, providerId: providerProfileId })

        expect(response.status).toBe(403)
        expect(response.body.success).toBe(false)
    })

    it('returns 403 when the resident does not belong to an estate', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${noEstateResidentToken}`)
            .send({ ...bookingPayload, providerId: providerProfileId })

        expect(response.status).toBe(403)
        expect(response.body.success).toBe(false)
    })

    it('returns 404 when the provider profile does not exist', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({
                ...bookingPayload,
                providerId: '00000000-0000-0000-0000-000000000000'
            })

        expect(response.status).toBe(404)
        expect(response.body.success).toBe(false)
    })

    it('returns 400 when the body contains a server controlled field', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({
                ...bookingPayload,
                providerId: providerProfileId,
                status: 'COMPLETED',
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it('returns 400 when description is too short', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ ...bookingPayload, providerId: providerProfileId, description: 'short' })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it('returns 400 when scheduledAt is not a valid datetime', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ ...bookingPayload, providerId: providerProfileId, scheduledAt: 'not-a-date' })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it('returns 400 when providerId is not a valid UUID', async () => {
        const response = await request(app)
            .post('/api/v1/bookings')
            .set('Authorization', `Bearer ${residentToken}`)
            .send({ ...bookingPayload, providerId: 'not-a-valid-uuid' })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })
})
