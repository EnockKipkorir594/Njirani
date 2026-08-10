import { registerSchema } from "./auth.schema.js";
import { RegisterInput } from "./auth.schema.js";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../../utils/response.js";
import { registerUser } from "./auth.service.js";
import { loginUser } from "./auth.service.js";
import { LoginInput } from "./auth.schema.js";
import { LoginSchema } from "./auth.schema.js";

export  async function registerHandler(

    req: Request < unknown, unknown, RegisterInput>,
    res: Response,
    next: NextFunction

){
    try{

        //parse the request  body 
        const parsedBody = registerSchema.parse(req.body);
        //call service registeruser function 
        const user = await registerUser(parsedBody);
        //send response 201 created 
        res.status(201).json(
            successResponse(user, 'User registered successfullly')
        )
    }catch(error){
        next(error);
    }
}

export async function loginHandler(
    req: Request < unknown, unknown, LoginInput>,
    res: Response,
    next: NextFunction
){
    try{
        //parse request body 
        const { email, password } = LoginSchema.parse(req.body)
        //call service loginuser functio 
        const user = await loginUser(email, password);
        //send response 200 success 
        res.status(200).json(
            successResponse(user, 'User logged in successfully')
        )
    }catch(error){
        next(error);
    }

}
