import { CreateBookingInput, ListBookingsQueryInput } from './bookings.schema.js';
import prisma from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { Prisma } from '../../generated/prisma/index.js';


export async function createBooking(
    residentId: string,
    bookingData: CreateBookingInput,
  ) {
    const providerProfile = await prisma.providerProfile.findUnique({
      where: {
        id: bookingData.providerId,
      },
      select: {
        userId: true,
        categoryId: true,
      },
    });
  
    if (!providerProfile) {
      throw new NotFoundError('Provider not found');
    }
  
    const providerUserId = providerProfile.userId;
    const categoryId = providerProfile.categoryId;
  
    const resident = await prisma.user.findUnique({
      where: {
        id: residentId,
      },
      select: {
        id: true,
        role: true,
        estateId: true,
      },
    });
  
    if (!resident) {
      throw new NotFoundError('Resident not found');
    }
  
    if (resident.role !== 'RESIDENT') {
      throw new ForbiddenError('Only residents can create bookings');
    }
  
    if (!resident.estateId) {
      throw new ForbiddenError(
        'Resident must belong to an estate before creating a booking',
      );
    }
  
    const estateId = resident.estateId;
  
    const createdBooking = await prisma.booking.create({
      data: {
        residentId,
        providerId: providerUserId,
        estateId,
        categoryId,
        description: bookingData.description,
        scheduledAt: new Date(bookingData.scheduledAt),
        status: 'PENDING',
        paymentStatus: 'PENDING',
        priceQuote: null,
      },
    });
  
    return createdBooking;
  }


  export async function listBookings(
    userId: string,
    role: 'RESIDENT' | 'PROVIDER' | 'ADMIN',
    filters: ListBookingsQueryInput,
  ) {
    const page = filters.page;
    const limit = filters.limit;
    const skip = (page - 1) * limit;
  
    const where: Prisma.BookingWhereInput = {};
  
    // ------------------------------------------------------------
    // Determine which bookings the authenticated user is allowed
    // to see.
    // ------------------------------------------------------------
  
    if (role === 'RESIDENT') {
      where.residentId = userId;
    } else if (role === 'PROVIDER') {
      where.providerId = userId;
    } else {
      throw new ForbiddenError(
        'Only residents and providers can view bookings',
      );
    }
  
    // ------------------------------------------------------------
    // Optional status filtering
    // ------------------------------------------------------------
  
    if (filters.status) {
      where.status = filters.status;
    }
  
    // ------------------------------------------------------------
    // Fetch bookings and total count using the exact same filter.
    // ------------------------------------------------------------
  
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
  
        orderBy: {
          createdAt: 'desc',
        },
  
        include: {
          resident: {
            select: {
              id: true,
              name: true,
            },
          },
  
          provider: {
            select: {
              id: true,
              name: true,
            },
          },
  
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
  
          estate: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
  
      prisma.booking.count({
        where,
      }),
    ]);
  
    return {
      bookings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

//get booking by id
export async function getBookingById(
    userId: string,
    bookingId: string,
  ) {
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
  
      include: {
        resident: {
          select: {
            id: true,
            name: true,
          },
        },
  
        provider: {
          select: {
            id: true,
            name: true,
          },
        },
  
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
  
        estate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }
  
    const isResident = booking.residentId === userId;
    const isProvider = booking.providerId === userId;
  
    if (!isResident && !isProvider) {
      throw new ForbiddenError(
        'You are not allowed to view this booking',
      );
    }
  
    return booking;
  }