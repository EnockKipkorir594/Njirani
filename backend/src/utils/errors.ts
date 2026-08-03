export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;


    constructor(
        message: string,
        statusCode: number,
        isOperational = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;

        //Maintains proper stack trace in v8 engines (node.js)
        Error.captureStackTrace(this, this.constructor);
    }
}

//HTTP-specific errors

export class BadRequestError extends AppError{
    constructor(message: 'Bad request'){
        super(message, 400);
    }

}
export class UnauthorizedError extends AppError{
    constructor(message: 'Unauthorized'){
        super(message, 400);
    }

}

export class ForbiddenError extends AppError{
    constructor(message: 'Forbidden'){
        super(message, 400);
    }

}
export class ConflictError extends AppError{
    constructor(message: 'Conflict'){
        super(message, 400);
    }

}
export class InternalServerError extends AppError{
    constructor(message: 'Internal Server Error'){
        super(message, 400);
    }

}



