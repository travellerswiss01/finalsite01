import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createReviewStorage} from './review-storage.js';

// Only enabled on services with an explicit DATABASE_URL. No database credentials
// are embedded in source code or exposed through HTTP responses.
export async function connectReviewDatabase({connectionString=process.env.DATABASE_URL}={}) {
  if (!connectionString) return null;
  const {Pool}=await import('pg');
  const pool=new Pool({connectionString,max:4,connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
  try {
    const schema=await readFile(fileURLToPath(new URL('../db/reviews.sql',import.meta.url)),'utf8');
    await pool.query(schema);
    const storage=createReviewStorage((sql,params)=>pool.query(sql,params));
    return {storage,close:()=>pool.end()};
  } catch (error) {
    await pool.end();
    throw error;
  }
}
