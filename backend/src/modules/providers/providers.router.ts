import Router from 'express'
import { createProviderHandler, listProvidersHandler } from './providers.controller.js'

const providerRouter = Router()

providerRouter.post('/create', createProviderHandler)


providerRouter.get('/list', listProvidersHandler)


export default providerRouter;