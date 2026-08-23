import type { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '../generated/prisma/index.js'
import { AppError } from '../utils/errors.js'
// Custom operational error (things you throw intentionally)


export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500
  let message = 'Internal server error'

  // Zod validation errors (400)
  if (err instanceof ZodError) {
    statusCode = 400
    message = `Validation failed: ${err.issues.map((e) => e.message).join(', ')}`
  }
  // Your custom AppErrors
  else if (err instanceof AppError) {
    statusCode = err.statusCode
    message = err.message
  }
  // Prisma: unique constraint violation (409 Conflict)
  else if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  ) {
    statusCode = 409
    message = 'Email or phone already registered'
  }
  // Prisma: record not found (404)
  else if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2025'
  ) {
    statusCode = 404
    message = 'Resource not found'
  }
  // Prisma: other known errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400
    message = 'Database request failed'
  }

  // Never leak stack traces in production
  const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack

  res.status(statusCode).json({
    success: false,
    message,
    ...(stack && { stack }),
  })
}

