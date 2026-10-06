import { Request, Response, NextFunction } from 'express';

import {
  CreateBookingInput,
  createBookingSchema,
  listBookingsQuerySchema,
  bookingIdSchema,
} from './bookings.schema.js';

import { createBooking, listBookings,
  getBookingById, acceptBooking, declineBooking} from './bookings.service.js';

import { successResponse } from '../../utils/response.js';

import { UnauthorizedError } from '../../utils/errors.js';
import { UserRole } from '../../generated/prisma/index.js';

export async function createBookingHandler(
  req: Request<unknown, unknown, CreateBookingInput>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const parsedBody = createBookingSchema.parse(req.body);

    const booking = await createBooking(
      req.user.userId,
      parsedBody,
    );

    return res.status(201).json(
      successResponse(
        booking,
        'Booking created successfully',
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function listBookingsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const parsedQuery = listBookingsQuerySchema.parse(req.query);

    const result = await listBookings(
      req.user.userId,
      req.user.role as UserRole,
      parsedQuery,
    );

    return res.status(200).json(
      successResponse(
        result.bookings,
        'Bookings retrieved successfully',
        result.meta,
      ),
    );
  } catch (error) {
    next(error);
  }
}


export async function getBookingByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const bookingId = bookingIdSchema.parse(req.params.id);

    const booking = await getBookingById(
      req.user.userId,
      bookingId,
    );

    return res.status(200).json(
      successResponse(
        booking,
        'Booking retrieved successfully',
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function acceptBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const bookingId = bookingIdSchema.parse(req.params.id);

    const booking = await acceptBooking(
      req.user.userId,
      bookingId,
    );

    return res.status(200).json(
      successResponse(
        booking,
        'Booking accepted successfully',
      ),
    );
  } catch (error) {
    next(error);
  }
}

export async function declineBookingHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    const bookingId = bookingIdSchema.parse(req.params.id);

    const booking = await declineBooking(
      req.user.userId,
      bookingId,
    );

    return res.status(200).json(
      successResponse(
        booking,
        'Booking declined successfully',
      ),
    );
  } catch (error) {
    next(error);
  }
}