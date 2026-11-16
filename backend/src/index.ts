import 'dotenv/config';
import express, {  Request, Response } from "express";
import { env } from './config/env.js';
import prisma from "./config/database.js";
import authRouter from './modules/auth/auth.router.js'; 
import estateRouter from './modules/estates/estates.router.js';
import providerRouter from './modules/providers/providers.router.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import bookingRouter from './modules/bookings/bookings.router.js';
import { errorHandler } from './middleware/error.middleware.js';



//initialize the app instance
const app = express()


//body parsing middleware
app.use(express.json())
app.use(generalLimiter);

//first Njirani route
app.get('/', (req, res) => {
    res.json({
        success : true,
        message : "Njirani API is running"
    })

});

//GET /health route
app.get('/health', async(req,res) => {
    try{
        
        await prisma.$queryRaw`SELECT 1`

        res.json({
            success: true,
            message: 'API is healthy',
            database: 'connected'
        })


    }catch(error){
        res.status(500).json({
            success: false,
            error,
            message: "API is running but database is down",
            database: "disconnected"
        })
    }
})

//Register auth endpoint 
app.use('/auth', authRouter);

//Register estates endpoint 
app.use('/estates', estateRouter);

//provider profile endpoints 
app.use('/api/providers', providerRouter)

//booking endpoints 
app.use('/api/v1/bookings', bookingRouter)



//404 handler 
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });

});

//global handler 
// Global error handler — must be registered after all routes.
app.use(errorHandler);

const PORT = env.PORT;

app.listen(PORT, () =>{
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
})


