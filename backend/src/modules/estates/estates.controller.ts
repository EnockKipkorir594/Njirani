import { Request, Response, NextFunction } from "express";
import { EstateInput, estateSchema } from "./estates.schema.js";
import { createEstate, getEstates, assignResidentEstate } from "./estates.service.js";
import { successResponse } from "../../utils/response.js";
import { ConflictError , UnauthorizedError } from "../../utils/errors.js";
import { listEstatesQuerySchema, assignResidentEstateSchema } from "./estates.schema.js";


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
) {
    try {
        const query = listEstatesQuerySchema.parse(req.query);
        const result = await getEstates({
            page: query.page,
            limit: query.limit,
            search: query.search,
        });

        res.status(200).json(
            successResponse(result.estates, 'List of estates', result.meta)
            //                                                    ↑ ADD META
        );
    } catch (error) {
        next(error);
    }
}

export async function assignResidentEstateHandler(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required'));
        }

        const parsedBody = assignResidentEstateSchema.parse(req.body);

        const result = await assignResidentEstate(
            req.user.userId,
            parsedBody.estateId
        );

        return res.status(200).json(
            successResponse(
                result,
                'Estate assigned successfully'
            )
        );
    } catch (error) {
        next(error);
    }
}