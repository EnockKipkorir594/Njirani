import Router from 'express'
import { createProviderHandler, listProvidersHandler } from './providers.controller.js'
import { authenticate } from '../../middleware/auth.middleware.js'
const providerRouter = Router()

providerRouter.post('/create', authenticate, createProviderHandler)


providerRouter.get('/list', listProvidersHandler)


export default providerRouter;