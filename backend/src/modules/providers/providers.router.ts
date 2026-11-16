import Router from 'express'
import { 
    createProviderHandler,
    updateProviderHandler, 
    getCurrentProviderProfileHandler, 
    listProvidersHandler, 
    listServiceCategoriesHandler } from './providers.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
const providerRouter = Router()

providerRouter.post('/create', authenticate, createProviderHandler)

providerRouter.get('/me', authenticate, getCurrentProviderProfileHandler);

providerRouter.patch('/:id', authenticate, updateProviderHandler)

providerRouter.get('/list', listProvidersHandler)

providerRouter.get('/categories', listServiceCategoriesHandler);

export default providerRouter;

