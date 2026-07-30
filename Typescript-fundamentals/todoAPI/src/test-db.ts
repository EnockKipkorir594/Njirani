import pool from "./db";

async function test() {
    try{
        const result = await pool.query("SELECT NOW()")
        console.log('Connected:', result.rows[0])

    }catch (err){

        console.error("Connection failed", err)
    }finally {
        await pool.end();
    }
}
test();