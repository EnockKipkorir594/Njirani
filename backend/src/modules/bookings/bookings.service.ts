import { CreateBookingInput } from './bookings.schema.js';
import prisma from '../../config/database.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';

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
