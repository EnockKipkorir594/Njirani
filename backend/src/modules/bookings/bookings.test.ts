import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { createTestApp } from '../../tests/helpers/app.js'
import prisma from '../../config/database.js'
import { signAccessToken } from '../../utils/jwt.js'


const app = createTestApp()

let residentId: string;
let residentToken: string;
let providerToken: string;
let providerUserId: string;
let providerProfileId: string;
let categoryId: string;
let estateId: string;
let noEstateResidentToken: string;
let residentTwoId: string;
let residentTwoToken: string;

let providerTwoUserId: string;
let providerTwoProfileId: string;
let providerTwoToken: string;


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


async function createBookingFixture(
    residentId: string,
    providerUserId: string,
    status: 'PENDING' | 'CONFIRMED' = 'PENDING',
  ) {
    return prisma.booking.create({
      data: {
        residentId,
        providerId: providerUserId,
        estateId,
        categoryId,
        description: `Booking fixture ${Date.now()} ${Math.random()}`,
        scheduledAt: new Date('2026-12-10T10:00:00.000Z'),
        status,
        paymentStatus: 'PENDING',
        priceQuote: null,
      },
    });
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
    providerUserId = provider.id;

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


    const providerTwo = await prisma.user.create({
        data: {
          name: 'Booking Test Provider Two',
          email: `provider-two-${timestamp}@njirani.co.ke`,
          phone: `+254703${timestamp.toString().slice(-6)}`,
          passwordHash: 'dummyhashfortests',
          role: 'PROVIDER',
          estateId,
        },
      });
      
    providerTwoUserId = providerTwo.id;
    
    providerTwoToken = signAccessToken({
    userId: providerTwo.id,
    role: providerTwo.role,
    });
    
    const providerTwoProfile = await prisma.providerProfile.create({
    data: {
        userId: providerTwo.id,
        categoryId,
        bio: 'Second booking test provider',
    },
    });
    
    providerTwoProfileId = providerTwoProfile.id;

    const residentTwo = await prisma.user.create({
    data: {
        name: 'Booking Test Resident Two',
        email: `resident-two-${timestamp}@njirani.co.ke`,
        phone: `+254704${timestamp.toString().slice(-6)}`,
        passwordHash: 'dummyhashfortests',
        role: 'RESIDENT',
        estateId,
    },
    });
    
    residentTwoId = residentTwo.id;
    
    residentTwoToken = signAccessToken({
    userId: residentTwo.id,
    role: residentTwo.role,
    });

})

afterAll( async () => {
    await prisma.booking.deleteMany({
        where: {
          residentId: {
            in: [residentId, residentTwoId],
          },
        },
      });
    await prisma.providerProfile.deleteMany({
    where: {
        id: {
        in: [providerProfileId, providerTwoProfileId],
        },
    },
    });
    await prisma.user.deleteMany({
        where: {
          id: {
            in: [
              residentId,
              residentTwoId,
              providerUserId,
              providerTwoUserId,
            ],
          },
        },
      });
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

describe('GET /api/v1/bookings', () => {
    let residentOneBookingA: string;
    let residentOneBookingB: string;
    let residentOneBookingC: string;
    let residentTwoBooking: string;
  
    beforeAll(async () => {
      /*
       * Resident 1 → Provider 1
    
       */
      await prisma.booking.deleteMany();
      const bookingA = await createBookingFixture(
        residentId,
        providerUserId,
        'PENDING',
      );
  
      residentOneBookingA = bookingA.id;
  
      /*
       * Resident 1 → Provider 1
       */
      const bookingB = await createBookingFixture(
        residentId,
        providerUserId,
        'CONFIRMED',
      );
  
      residentOneBookingB = bookingB.id;
  
      /*
       * Resident 1 → Provider 2
       */
      const bookingC = await createBookingFixture(
        residentId,
        providerTwoUserId,
        'PENDING',
      );
  
      residentOneBookingC = bookingC.id;
  
      /*
       * Resident 2 → Provider 1
       */
      const bookingD = await createBookingFixture(
        residentTwoId,
        providerUserId,
        'PENDING',
      );
  
      residentTwoBooking = bookingD.id;
    });
  
    it('returns only bookings belonging to the authenticated resident', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${residentToken}`);
  
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
  
      expect(response.body.data).toHaveLength(3);
  
      const bookingIds = response.body.data.map(
        (booking: { id: string }) => booking.id,
      );
  
      expect(bookingIds).toContain(residentOneBookingA);
      expect(bookingIds).toContain(residentOneBookingB);
      expect(bookingIds).toContain(residentOneBookingC);
  
      expect(bookingIds).not.toContain(residentTwoBooking);
    });
  
    it('returns only bookings assigned to the authenticated provider', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${providerToken}`);
  
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
  
      expect(response.body.data).toHaveLength(3);
  
      const bookingIds = response.body.data.map(
        (booking: { id: string }) => booking.id,
      );
  
      expect(bookingIds).toContain(residentOneBookingA);
      expect(bookingIds).toContain(residentOneBookingB);
      expect(bookingIds).toContain(residentTwoBooking);
  
      expect(bookingIds).not.toContain(residentOneBookingC);
    });
  
    it('returns only bookings assigned to the second provider', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${providerTwoToken}`);
  
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
  
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(residentOneBookingC);
    });
  
    it('filters resident bookings by status', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${residentToken}`);
  
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
  
      expect(response.body.data).toHaveLength(2);
  
      for (const booking of response.body.data) {
        expect(booking.residentId).toBe(residentId);
        expect(booking.status).toBe('PENDING');
      }
    });
  
    it('returns pagination metadata', async () => {
      const response = await request(app)
        .get('/api/v1/bookings')
        .query({
          page: 1,
          limit: 2,
        })
        .set('Authorization', `Bearer ${residentToken}`);
  
      expect(response.status).toBe(200);
  
      expect(response.body.meta).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
  
      expect(response.body.data).toHaveLength(2);
    });
  
    it('returns 401 when authentication is missing', async () => {
      const response = await request(app)
        .get('/api/v1/bookings');
  
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  
    it('returns 403 when an ADMIN attempts normal booking listing', async () => {
      const admin = await prisma.user.create({
        data: {
          name: 'Booking Test Admin',
          email: `admin-booking-${timestamp}@njirani.co.ke`,
          phone: `+254705${timestamp.toString().slice(-6)}`,
          passwordHash: 'dummyhashfortests',
          role: 'ADMIN',
        },
      });
  
      const adminToken = signAccessToken({
        userId: admin.id,
        role: admin.role,
      });
  
      const response = await request(app)
        .get('/api/v1/bookings')
        .set('Authorization', `Bearer ${adminToken}`);
  
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
  
      await prisma.user.delete({
        where: {
          id: admin.id,
        },
      });
    });



describe('GET /api/v1/bookings/:id', () => {
  it('allows a resident to view their own booking', async () => {
      const response = await request(app)
      .get(`/api/v1/bookings/${residentOneBookingA}`)
      .set('Authorization', `Bearer ${residentToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.id).toBe(residentOneBookingA);
      expect(response.body.data.residentId).toBe(residentId);
      expect(response.body.data.providerId).toBe(providerUserId);
  });

  it('allows the assigned provider to view the booking', async () => {
      const response = await request(app)
      .get(`/api/v1/bookings/${residentOneBookingA}`)
      .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      expect(response.body.data.id).toBe(residentOneBookingA);
  });

  it('prevents another resident from viewing the booking', async () => {
      const response = await request(app)
      .get(`/api/v1/bookings/${residentOneBookingA}`)
      .set('Authorization', `Bearer ${residentTwoToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
  });

  it('prevents an unrelated provider from viewing the booking', async () => {
      const response = await request(app)
      .get(`/api/v1/bookings/${residentOneBookingA}`)
      .set('Authorization', `Bearer ${providerTwoToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
  });

  it('returns 404 when the booking does not exist', async () => {
      const response = await request(app)
      .get('/api/v1/bookings/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${residentToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
  });

  it('returns 400 when the booking ID is not a valid UUID', async () => {
      const response = await request(app)
      .get('/api/v1/bookings/not-a-valid-uuid')
      .set('Authorization', `Bearer ${residentToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
  });

  it('returns 401 when authentication is missing', async () => {
      const response = await request(app)
      .get(`/api/v1/bookings/${residentOneBookingA}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
});

describe('PATCH /api/v1/bookings/:id/accept', () => {
  it('allows the assigned provider to accept a pending booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/accept`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(booking.id);
      expect(response.body.data.status).toBe('CONFIRMED');
  });

  it('persists the accepted booking as CONFIRMED', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/accept`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(200);

      const updatedBooking = await prisma.booking.findUnique({
          where: {
              id: booking.id,
          },
      });

      expect(updatedBooking).not.toBeNull();
      expect(updatedBooking?.status).toBe('CONFIRMED');
  });

  it('returns 401 when authentication is missing', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/accept`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
  });

  it('returns 403 when a resident attempts to accept a booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/accept`)
          .set('Authorization', `Bearer ${residentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
  });

  it('returns 403 when an unrelated provider attempts to accept the booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/accept`)
          .set('Authorization', `Bearer ${providerTwoToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
  });

  it('returns 404 when the booking does not exist', async () => {
      const response = await request(app)
          .patch(
              '/api/v1/bookings/00000000-0000-0000-0000-000000000000/accept',
          )
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
  });

  it('returns 400 when the booking ID is not a valid UUID', async () => {
      const response = await request(app)
          .patch('/api/v1/bookings/not-a-valid-uuid/accept')
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
  });

  it('returns 409 when attempting to accept an already confirmed booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'CONFIRMED',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/accept`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
  });

  it('returns 409 when attempting to accept a cancelled booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      await prisma.booking.update({
          where: {
              id: booking.id,
          },
          data: {
              status: 'CANCELLED',
          },
      });

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/accept`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
  });
});

describe('PATCH /api/v1/bookings/:id/decline', () => {
  it('allows the assigned provider to decline a pending booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/decline`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(booking.id);
      expect(response.body.data.status).toBe('CANCELLED');
  });

  it('persists the declined booking as CANCELLED', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/decline`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(200);

      const updatedBooking = await prisma.booking.findUnique({
          where: {
              id: booking.id,
          },
      });

      expect(updatedBooking).not.toBeNull();
      expect(updatedBooking?.status).toBe('CANCELLED');
  });

  it('returns 401 when authentication is missing', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/decline`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
  });

  it('returns 403 when a resident attempts to decline a booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/decline`)
          .set('Authorization', `Bearer ${residentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
  });

  it('returns 403 when an unrelated provider attempts to decline the booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/decline`)
          .set('Authorization', `Bearer ${providerTwoToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
  });

  it('returns 404 when the booking does not exist', async () => {
      const response = await request(app)
          .patch(
              '/api/v1/bookings/00000000-0000-0000-0000-000000000000/decline',
          )
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
  });

  it('returns 400 when the booking ID is not a valid UUID', async () => {
      const response = await request(app)
          .patch('/api/v1/bookings/not-a-valid-uuid/decline')
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
  });

  it('returns 409 when attempting to decline an already confirmed booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'CONFIRMED',
      );

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/decline`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
  });

  it('returns 409 when attempting to decline an already cancelled booking', async () => {
      const booking = await createBookingFixture(
          residentId,
          providerUserId,
          'PENDING',
      );

      await prisma.booking.update({
          where: {
              id: booking.id,
          },
          data: {
              status: 'CANCELLED',
          },
      });

      const response = await request(app)
          .patch(`/api/v1/bookings/${booking.id}/decline`)
          .set('Authorization', `Bearer ${providerToken}`);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
  });
});

});

