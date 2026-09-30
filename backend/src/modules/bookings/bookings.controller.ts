import { Request, Response, NextFunction } from "express";
import { CreateBookingInput, createBookingSchema } from "./bookings.schema.js";
import { createBooking } from "./bookings.service.js";
import { successResponse } from "../../utils/response.js";
import { UnauthorizedError } from "../../utils/errors.js";

export async function createBookingHandler(
    req: Request<unknown, unknown, CreateBookingInput>,
    res: Response,
    next: NextFunction
) {
    try {
        // req.user is set by your authenticate middleware
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'))
        }

        // Validate body
        const parsedBody = createBookingSchema.parse(req.body)

        // residentId comes from the token, never from the body
        const booking = await createBooking(req.user.userId, parsedBody)

        res.status(201).json(
            successResponse(booking, 'Booking created successfully')
        )

    } catch (error) {
        next(error)
    }
}
