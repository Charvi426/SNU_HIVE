import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

console.log('Config path:', join(__dirname, '..', '.env'));
console.log('Environment variables loaded:', {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_DATABASE: process.env.DB_DATABASE,
    hasPassword: !!process.env.DB_PASSWORD
});

if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_DATABASE) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    connectionLimit: 50,
    waitForConnections: true,
    queueLimit: 25,

    connectTimeout: 60000
});

try {
    const connection = await pool.getConnection();
    const [result] = await connection.query('SELECT 1');
    console.log('Successfully connected to MySQL database');
    connection.release();
} catch (error) {
    console.error('Failed to connect to database:', {
        message: error.message,
        code: error.code,
        state: error.sqlState
    });
    process.exit(1);
}

export default pool;