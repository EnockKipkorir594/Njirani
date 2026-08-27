import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../../tests/helpers/app.js'
import prisma from '../../config/database.js'
import { cleanDatabase } from '../../tests/helpers/cleanup.js'

const app = createTestApp()

// ── Setup and teardown ────────────────────────────────────────────


beforeAll(async () => {
    // Clean the test database before running tests
    await cleanDatabase()
})

afterAll(async () => {
    // Clean up after all tests finish
    await prisma.user.deleteMany()
    await prisma.$disconnect
})

// ── Register tests ────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
    it('creates a new user and returns 201', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name:     'Enock Kipkorir',
                email:    'enock@njirani.co.ke',
                phone:    '+254713595262',
                password: 'SecurePass123!',
                role:     'RESIDENT',
            })

        expect(response.status).toBe(201)
        expect(response.body.success).toBe(true)
        expect(response.body.data.user.email).toBe('enock@njirani.co.ke')

        // Password hash must never appear in the response
        expect(response.body.data.user.passwordHash).toBeUndefined()
    })

    it('returns 409 when email already exists', async () => {
        // Send the same email again
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name:     'Enock Again',
                email:    'enock@njirani.co.ke', // same email
                phone:    '+254700000000',
                password: 'SecurePass123!',
                role:     'RESIDENT',
            })

        expect(response.status).toBe(409)
        expect(response.body.success).toBe(false)
    })

    it('returns 400 when required fields are missing', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Incomplete User',
                // missing email, phone, password, role
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it('returns 400 when email format is invalid', async () => {
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name:     'Bad Email User',
                email:    'not-an-email',
                phone:    '+254700000001',
                password: 'SecurePass123!',
                role:     'RESIDENT',
            })

        expect(response.status).toBe(400)
    })
})

// ── Login tests ───────────────────────────────────────────────────

describe('POST /api/v1/auth/login', () => {

    it('returns a token when credentials are correct', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email:    'enock@njirani.co.ke',
                password: 'SecurePass123!',
            })

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.data.accessToken).toBeDefined()
        expect(response.body.data.refreshToken).toBeDefined()

        // Token should start with eyJ — Base64 encoded JWT header
        expect(response.body.data.accessToken).toMatch(/^eyJ/)
    })

    it('returns 401 when password is wrong', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email:    'enock@njirani.co.ke',
                password: 'WrongPassword',
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('returns 401 when email does not exist', async () => {
        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email:    'nobody@njirani.co.ke',
                password: 'SecurePass123!',
            })

        expect(response.status).toBe(401)
    })
})

// ── Auth middleware tests ─────────────────────────────────────────

describe('GET /api/v1/auth/me', () => {

    it('returns user when token is valid', async () => {
        // First login to get a token
        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email:    'enock@njirani.co.ke',
                password: 'SecurePass123!',
            })
        expect(loginResponse.status).toBe(200)
        expect(loginResponse.body.data.accessToken).toBeDefined()

        const token = loginResponse.body.data.accessToken

        // Use the token to hit a protected route
        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
        expect(response.body.user).toBeDefined()
    })

    it('returns 401 when no token is provided', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me')
        // No Authorization header

        expect(response.status).toBe(401)
    })

    it('returns 401 when token is malformed', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer thisisnotavalidtoken')

        expect(response.status).toBe(401)
    })

    it('returns 401 when Bearer prefix is missing', async () => {
        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'eyJhbGci...')
        // Token without Bearer prefix

        expect(response.status).toBe(401)
    })
})