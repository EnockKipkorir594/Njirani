import 'dotenv/config';
import express, {  Request, Response } from "express";
import { env } from './config/env.js';
import prisma from "./config/database.js";
import authRouter from './modules/auth/auth.router.js'; 
import { AppError } from './utils/errors.js';
import { errorResponse } from './utils/response.js';
import estateRouter from './modules/estates/estates.router.js';
import providerRouter from './modules/providers/providers.router.js';



//initialize the app instance
const app = express()


//body parsing middleware
app.use(express.json())

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
app.use('/providers', providerRouter)

//404 handler 
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });

});

//global handler 
app.use((err: Error, _req: Request, res: Response) => {
    console.error('Unhandled Error', err);

    if (err instanceof AppError && err.isOperational){
        res.status(err.statusCode).json(
            errorResponse(err.message, err.constructor.name.replace('Error','').toUpperCase())
        )
        return;

    }

    //Generic error handler 
    res.status(500).json(
        errorResponse(
            env.NODE_ENV === 'development' ? err.message : 'Internal server error', 
            'INTERNAL ERROR'
        )
    );
});

const PORT = env.PORT;

app.listen(PORT, () =>{
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
})
