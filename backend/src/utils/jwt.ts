import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { UserRole } from "../generated/prisma/index.js";

interface  TokenPayload {
    userId : string;
    role : UserRole ;
};


export function signAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET,{expiresIn: '15m'});
}

export  function signRefreshToken (payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {expiresIn: '7d'});

} 

export  function signedAccessToken (token: string): TokenPayload {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}


