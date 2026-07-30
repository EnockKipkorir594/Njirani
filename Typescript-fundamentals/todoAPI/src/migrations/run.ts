import pool from "../db";

const createTablE  = `
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP 
);
`;

async function migrate (){
    try {
        await pool.query(createTablE);
        console.log('Todos table created')

    }catch(err){
        console.error("Migration failed", err);

    }finally{
        await pool.end();
    }
}
migrate(); 