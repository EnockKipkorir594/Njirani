import { authenticate, requireRole } from "../../middleware/auth.middleware.js";
import { createEstateHandler, getEstatesHandler, assignResidentEstateHandler } from "./estates.controller.js";
import { Router } from "express";


const estateRouter = Router()

//create estate route 
estateRouter.post('/create', authenticate, requireRole(['ADMIN']), createEstateHandler)

//Get all estates 
estateRouter.get('/list', getEstatesHandler)

estateRouter.patch(
    '/me',
    authenticate,
    requireRole(['RESIDENT']),
    assignResidentEstateHandler
);

export default estateRouter;

