import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js';
import { env } from '../config/env.js';
import jwt from 'jsonwebtoken'
import { UserRole } from '../generated/prisma/index.js';


interface JwtPayload {
    userId : string;
    role : UserRole;
}

export  function authenticate(req: Request, res:Response, next:NextFunction) {

    //authentication (who are you ?)

    //Initialize a token 
    let token: string | undefined ;
    //check if authorization header exists and  header startwith bearer 
    if (req.headers.authorization?.startsWith('Bearer')){
        //extract the token 
        token = req.headers.authorization.split(' ')[1];
    }
    //If no token is provided  throw unauthorized error
    if(!token){
        return next(new UnauthorizedError('Unauthorized'))
    
    }

    try{
        //verify the provided token if it is valid or has been tampared with.
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload
          
        //attaches the req to the decoded payload 
        req.user = decoded
        next();


    }catch(error){
        if (error instanceof jwt.TokenExpiredError){
            return next(new UnauthorizedError('Token has expired'))
        }
        //throw error if the provided token is expired or invalid.
        return next(new UnauthorizedError('Invalid token'))

    }
    
}

export function requireRole( allowedRoles: string[]){
    return (req: Request, res: Response, next: NextFunction) => {
        //if not user throw an unauthorized error
        if (!req.user){
            return next(new UnauthorizedError('Unathorized'))

        }
        //if role is ot allowed throw forbidden error 
        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError('Forbidden'))
        }

        next();
    };
}