import 'dotenv/config';
import express, {  Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from './config/env.js';
import prisma from "./config/database.js";



//initialize the app instance 

const app = express();

//body parsing middleware
app.use(express.json())

//first Njirani route
app.get('/', (req, res) => {
    res.json({
        success : true,
        message : "Njirani API is running"
    })

});

//GET /heaalth route
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
            message: "API is running but database is down",
            database: "disconnected"
        })
    }
})

//404 handler 
app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });

});

//global handler 
app.use((err:unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled Error', err);

    if (err instanceof ZodError){
        const ZodError = err as ZodError
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: ZodError.issues.map((e) => ({
                path: e.path.join('.'),
                message: e.message
            })),
        });
        return;

    }

    //Generic error handler 
    if (err instanceof ZodError)
    res.status(500).json({
        success: false,
        message : env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    });
})

const PORT = env.PORT;

app.listen(PORT, () =>{
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
})