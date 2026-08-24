import { createProviderProfile, listProviderProfiles} from "./providers.service.js"
import {  providerSchema, listProvidersQuerySchema } from "./providers.schema.js"
import { Request, Response, NextFunction } from "express"
import { successResponse } from "../../utils/response.js";

export async function createProviderHandler(
    req: Request<unknown, unknown, unknown, unknown>, // adjust if you have body types
    res: Response,
    next: NextFunction
  ) {
    try {
      // req.user is set by your authenticate middleware
      const userId = (req as any).user.userId;
  
      // Validate body
      const parsedBody = providerSchema.parse(req.body);
  
      const profile = await createProviderProfile(userId, parsedBody);
  
      res.status(201).json(
        successResponse(profile, 'Provider profile created successfully')
      );
    } catch (error) {
      next(error);
    }
  }
  
  export async function listProvidersHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      // Validate/coerce query params
      const query = listProvidersQuerySchema.parse(req.query);
  
      const result = await listProviderProfiles({
        categoryId: query.categoryId,
        categorySlug: query.categorySlug,
        search: query.search,
        page: query.page,
        limit: query.limit,
        sortBy: query.sortBy,
      });
  
      res.status(200).json(
        successResponse(result.profiles, 'Provider profiles retrieved successfully', result.meta)
      );
    } catch (error) {
      next(error);
    }
  }