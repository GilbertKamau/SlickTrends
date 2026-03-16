import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDB() {
    try {
        console.log('Connecting to PostgreSQL...');
        const client = await pool.connect();
        console.log('✅ Connected!');
        
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:', res.rows.map(r => r.table_name));
        
        const ordersCheck = await client.query('SELECT COUNT(*) FROM orders');
        console.log('Orders count:', ordersCheck.rows[0].count);
        
        client.release();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    } finally {
        await pool.end();
    }
}

checkDB();
