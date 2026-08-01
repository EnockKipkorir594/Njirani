import express from "express";
import { config }  from  "dotenv";
import prisma from "./config/database";

config()
//initialize the app instance 
const PORT = process.env.PORT || 8000 ; 
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
app.use('/health', async(req,res) => {
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

app.listen(PORT, () =>{
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
})