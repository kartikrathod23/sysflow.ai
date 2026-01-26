import {Pool} from 'pg';

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
}); 

pool.on('connect',()=>{
    console.log('PostgreSQL pool connected');
})

pool.on('error',(err)=>{
    console.error('Unexpected error on idle client', err);
})

export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('executed query', {text, duration, rows: res.rowCount});
    return res;
}


export default pool;
