import express, { NextFunction } from "express";
import { type Request, type Response } from "express";
import {z} from "zod";

const app = express();

const port = 3000;

//routes

app.get('/', (req, res) => {
    res.send('Hello Express');
});

app.get('/health', (req, res) => {
    res.json({status : 'ok'});
});
app.use(express.json());
app.post('/echo', (req: Request, res: Response) => {
    res.json(req.body);
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

});

//Zod schema 
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
        res.status(400).json({  
            error : "Validation failed",
            details  : result.error.issues
        });
        return ;

    }   
        req.body = result.data
        next();
    }
}
const users = [
    {id: 1, name: "Enock"},
    {id :2, name: "Mariah"}
]

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