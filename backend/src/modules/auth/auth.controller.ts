import { registerSchema } from "./auth.schema.js";
import { RegisterInput } from "./auth.schema.js";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/response.js";
import { registerUser } from "./auth.service.js";

export  async function registerHandler(

    req: Request < unknown, unknown, RegisterInput>,
    res: Response,
    next: NextFunction

){
    try{
        const parsedBody = registerSchema.parse(req.body);

        const user = await registerUser(parsedBody);

        res.status(201).json(
            successResponse(user, 'User registered successfullly')
        )
    }catch(error){
        next(error);
    }
}


