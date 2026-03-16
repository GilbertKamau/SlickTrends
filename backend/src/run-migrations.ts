import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const migrations = [
    '001_create_orders.sql',
    '002_create_order_items.sql',
    '003_create_transactions.sql',
    '004_create_abandoned_carts.sql'
];

async function runMigrations() {
    try {
        console.log('Starting migrations...');
        const client = await pool.connect();
        
        for (const file of migrations) {
            console.log(`Running ${file}...`);
            const sql = fs.readFileSync(path.join(__dirname, 'migrations', file), 'utf8');
            await client.query(sql);
            console.log(`✅ ${file} completed.`);
        }
        
        client.release();
        console.log('All migrations finished successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigrations();
