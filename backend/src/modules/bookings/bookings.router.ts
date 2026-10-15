import Router from 'express';
import {
    createBookingHandler,
    listBookingsHandler,
    getBookingByIdHandler,
    acceptBookingHandler,
    declineBookingHandler,
    cancelBookingHandler,
    startBookingHandler,
    completeBookingHandler,
  } from './bookings.controller.js';
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

bookingRouter.get('/', authenticate, listBookingsHandler);

bookingRouter.patch(
    '/:id/accept',
    authenticate,
    requireRole([UserRole.PROVIDER]),
    acceptBookingHandler,
);

bookingRouter.patch(
    '/:id/decline',
    authenticate,
    requireRole([UserRole.PROVIDER]),
    declineBookingHandler,
);


bookingRouter.patch(
    '/:id/cancel',
    authenticate,
    requireRole([UserRole.RESIDENT, UserRole.PROVIDER]),
    cancelBookingHandler,
  );


bookingRouter.patch(
  '/:id/start',
  authenticate,
  requireRole([UserRole.PROVIDER]),
  startBookingHandler,
);
  
bookingRouter.patch(
  '/:id/complete',
  authenticate,
  requireRole([UserRole.PROVIDER]),
  completeBookingHandler,
);

bookingRouter.get('/:id', authenticate, getBookingByIdHandler);


export default bookingRouter;
