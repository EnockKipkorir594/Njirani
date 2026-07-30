import { Request , Response } from "express";
import pool from "./db";
import express, { NextFunction } from "express";
import { z } from "zod";


const app = express()
const PORT = 3000

//Global middleware
app.use(express.json())

//todoSchema using zod 
const todoSchema  = z.object ({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['pending', 'in-progress', 'done']).optional()
}).strict();

//updateTodoSchema for PUT 
const updateTodoSchema  = z.object ({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    status: z.enum(['pending', 'in-progress', 'done']).optional()
}).strict();

//Validation body using zod

function validateBody(schema: z.ZodSchema){
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if(!result.success){
            const error = new Error('Validation Error');
            (error as any ).status = 400;
            (error as any ).details = result.error.issues;
            next(error);
            return;
        }

        req.body = result.data;
        next();

    }
}

//implementing filtering and sorting 
//get todos route 
app.get('/todos', async ( req , res) => {

    const {status, sort = "created_at", order = "desc"} = req.query;

    let query = "SELECT * FROM todos";
    const params: any[] = [];
    const conditions: string[] = [];

    if(status){
        conditions.push(`status = $${params.length + 1}`);
        params.push(status as string);
    }

    if (conditions.length > 0){
        query += " WHERE " + conditions.join(" AND ");
    }

    const validSort = ["created_at", "updated_at", "title"].includes(sort as string) ?sort: "created_at";
    const validOrder = order === "asc" ? "ASC" : "DESC";
    query += ` ORDER BY ${validSort} ${validOrder}`;

    const result = await pool.query(query, params);
    res.json(result.rows);

});

//get todo by id route 
app.get('/todos/:id', async (req , res) => {
    const  id  = parseInt(req.params.id);

    if (isNaN(id)){
        res.status(400).json({ error: "Invalid id "});
        return;
    }

    const result = await pool.query("SELECT * FROM todos where id = $1", [id]);

    if (result.rows.length === 0){

        res.status(404).json({ error: "Todo not found"});
        return;
    }

    res.json(result.rows[0]);
});

//POST todos route (create todos)
app.post('/todos', validateBody(todoSchema) , async(req, res) => {
    const { title, description, status} = req.body;

    const result = await pool.query("INSERT INTO todos (title, description, status) VALUES($1, $2, $3) RETURNING *", 
        [title, description, status || "pending"]);

    res.status(201).json(result.rows[0]);
 });

 //PUT todos route (update a todo)
 app.put('/todos/:id', validateBody(updateTodoSchema), async(req, res) => {
    const { id } = req.params;
    const { title, description, status } = req.body ;

    const result = await pool.query(
        "UPDATE todos SET title = $1, description = $2, status =$3, updated_at =  now() WHERE id = $4 RETURNING *",
        [title, description, status, id]
    
    );

    if (result.rows.length === 0){
        res.status(404).json({ error: "Todo not found"});
        return; 
    }


    res.json(result.rows[0]);
 });

 //DELETE todos (delete todo by id)
 app.delete('/todos/:id', async(req, res) => {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM todos WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0){
        res.status(404).json({ error: "Todo not found"});
    }

    res.status(204).send();
 });

 //404 error handler 
app.use(( req,res,next) => {
    const error = new Error(`Route ${req.method} ${req.path} not found`);
    (error as any ).status = 404;
    next(error)
}) 

//Error handling middleware 500
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status  || 500;
    const message = err.message || "Internal server error";
    res.status(status).json({
        error: message,
        details: err.details || undefined
    });
});


 app.listen( PORT, () =>{
    console.log(`Server is running on http://localhost:${PORT}`);
 })


