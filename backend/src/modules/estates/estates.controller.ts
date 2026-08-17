import { Request, Response, NextFunction } from "express";
import { EstateInput, estateSchema } from "./estates.schema.js";
import { createEstate, getEstates } from "./estates.service.js";
import { successResponse } from "../../utils/response.js";
import { ConflictError } from "../../utils/errors.js";


export async function createEstateHandler (
    req: Request < unknown, unknown, EstateInput >,
    res: Response,
    next : NextFunction
) {
    try {

        const parsedBody = estateSchema.parse(req.body)

        const estate = await createEstate(parsedBody)

        if (!estate){
            return next (new ConflictError('Estate could not be retrieved after creation'))
        }

        res.status(201).json(
            successResponse(estate, 'Estate created successfully')
        )

    }catch(error){
        next(error)
    }
}

export async function getEstatesHandler(
    req: Request,
    res: Response,
    next: NextFunction
){
    try {

        const estates = await getEstates();

        res.status(200).json(
            successResponse(estates, 'List of estates')
        )

    }catch(error){
        next(error);
    }
}