import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken'

export  function authenticate(req: Request, res:Response, next:NextFunction) {

    //authentication (who are you ?)

    //Initialize a token 
    let token;
    //check if authorization headers startwith bearer 
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        //extract the token 
        token = req.headers.authorization.split(' ')[1];
    }
    //If no token is provided  throw unauthorized error
    if(!token){
        throw new UnauthorizedError('Unauthorized')
    }

    try{
        //verify the provided token if it is valid or has been tampared with.
        const decode = jwt.verify(token, env.JWT_SECRET) as {
            userId: string;
            role: string;
        }
        req.user = decode
        next();


    }catch(error){
        //throw error if the provided token is expired or invalid.
        throw new UnauthorizedError('Invalid or expired token')

    }

    
}

export function requireRole( allowedRoles: string[]){
    return (req: Request, res: Response, next: NextFunction) => {
        //if not user throw an unauthorized error
        if (!req.user){
            throw new UnauthorizedError('Unathorized')

        }
        //if role is ot allowed throw forbidden error 
        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError('Forbidden')
        }

        next();
    };
}