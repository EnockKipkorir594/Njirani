import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

interface  TokenPayload {
    userId : string;
    role : string ;
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


