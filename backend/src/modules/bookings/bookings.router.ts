import Router from 'express';
import { createBookingHandler } from './bookings.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.middleware.js';
import { UserRole } from '../../generated/prisma/index.js';

const bookingRouter = Router();

//Only an authenticated resident can create a booking.
bookingRouter.post(
    '/',
    authenticate,
    requireRole([UserRole.RESIDENT]),
    createBookingHandler,
);

export default bookingRouter;
