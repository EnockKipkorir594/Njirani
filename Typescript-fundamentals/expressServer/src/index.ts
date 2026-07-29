import express, { NextFunction } from "express";
import { type Request, type Response } from "express";
import {z} from "zod";

const app = express();

const port = 3000;

//Global middleware 
app.use(express.json());

//routes
app.get('/', (req, res) => {
    res.send('Hello Express');
});
app.get('/health', (req, res) => {
    res.json({status : 'ok'});
});
app.post('/echo', (req, res) => {
    res.json(req.body);
});


//Zod schema instad of using interface 
const createUserSchema = z.object({
    name : z.string().min(1),
    email : z.string().email(),
    age : z.number().optional()
})


//Validation middleware 
function validateBody(schema : z.ZodSchema){
    return (req: Request,res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success){
            const error = new Error('Validation Error');
            (error as any).status = 400;
            (error as any).details =  result.error.issues;
            next(error);
            return;

    };
        req.body = result.data
        next();
        
    }
}
const users = [
    {id: 1, name: "Enock"},
    {id :2, name: "Mariah"}
]
//Implementing Zod validation middleware
app.post('/users',validateBody(createUserSchema), (req, res) => {
    const newUser = {
        id: users.length + 1, 
        name : req.body.name,
        email : req.body.email,
        age : req.body.age

    };
    users.push(newUser);
    res.status(201).json(newUser);

});

//404 error handler 
app.use(( req,res,next) => {
    const error = new Error(`Route ${req.method} ${req.path} not found`);
    (error as any ).status = 404;
    next(error)
}) 

//Error handling middleware 
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status  || 500;
    const message = err.message || "Internal server error";
    res.status(status).json({
        error: message,
        details: err.details || undefined
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});