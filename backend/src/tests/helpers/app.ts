import express from 'express'
import { json } from 'express'
import authRouter from '../../modules/auth/auth.router.js'
import estatesRouter from '../../modules/estates/estates.router.js'
import { errorHandler } from '../../middleware/error.middleware.js'

// Create a test instance of your Express app
// Separate from your main app so tests do not start a real server
export function createTestApp() {
    const app = express()

    app.use(json())

    // Mount your routers
    app.use('/api/v1/auth',    authRouter)
    app.use('/api/v1/estates', estatesRouter)

    // Global error handler must be last
    app.use(errorHandler)

    return app
}