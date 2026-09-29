import { createProviderProfile, updateProviderProfile, listProviderProfiles} from "./providers.service.js"
import {  providerSchema, listProvidersQuerySchema, updateProviderSchema } from "./providers.schema.js"
import { Request, Response, NextFunction } from "express"
import { successResponse } from "../../utils/response.js";
import { UnauthorizedError } from "../../utils/errors.js";

export async function createProviderHandler(
    req: Request<unknown, unknown, unknown, unknown>, // adjust if you have body types
    res: Response,
    next: NextFunction
  ) {
    try {
      // req.user is set by your authenticate middleware
      if (!req.user) {
        return next(
          new UnauthorizedError('Authentication required')
        )
      }
  
      // Validate body
      const parsedBody = providerSchema.parse(req.body);
  
      
      const profile = await createProviderProfile(
        req.user.userId,
        parsedBody
      )
  
      res.status(201).json(
        successResponse(profile, 'Provider profile created successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  export async function updateProviderHandler(
    req: Request<{ id : string }>,
    res: Response,
    next: NextFunction,
  ) {
    try {
      // 1. Make sure the request is authenticated
      if (!req.user) {
        return next(
          new UnauthorizedError('Authentication required'),
        );
      }
  
      // 2. Get the provider profile ID from the URL
      const providerId = req.params.id;
  
      // 3. Validate the update body
      const parsedBody = updateProviderSchema.parse(req.body);
  
      // 4. Pass authenticated user + target profile + validated data
      //    to the service layer.
      const profile = await updateProviderProfile(
        req.user.userId,
        providerId,
        parsedBody,
      );
  
      // 5. Return the updated provider profile
      return res.status(200).json(
        successResponse(
          profile,
          'Provider profile updated successfully',
        ),
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
        lat: query.lat,
        lng: query.lng,
        radiusKm: query.radiusKm,
      });
  
      res.status(200).json(
        successResponse(result.profiles, 'Provider profiles retrieved successfully', result.meta)
      );
    } catch (error) {
      next(error);
    }
  }