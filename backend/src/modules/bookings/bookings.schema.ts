import { z } from 'zod';

//strictObject, not object: any key not listed below is rejected.
//residentId, estateId, categoryId, status, paymentStatus and priceQuote
//are derived server-side, so a client sending them is a contract violation.
export const createBookingSchema = z.strictObject({
  providerId: z
    .string()
    .uuid('Provider ID must be a valid UUID'),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters')
    .trim(),

  scheduledAt: z
    .string()
    .datetime('Must be a valid ISO datetime'),
});

//for the list bookings route
export const listBookingsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(20),

  status: z
    .enum([
      'PENDING',
      'CONFIRMED',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),

});

//for the get booking by id route
export const bookingIdSchema = z.string().uuid(
  'Booking ID must be a valid UUID',
);

export type BookingIdInput = z.infer<typeof bookingIdSchema>;

export type ListBookingsQueryInput = z.infer<typeof listBookingsQuerySchema>;

export type CreateBookingInput = z.infer<typeof createBookingSchema>;


