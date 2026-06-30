import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback to local DB if no string provided
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microps',
  port: parseInt(process.env.PGPORT || '5432'),
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
  process.exit(-1);
});
