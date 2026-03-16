import { query } from './config/db.postgres';
import Product from './models/Product';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Mock user for admin
const mockUser = { id: '65f013456789012345678901', role: 'superadmin' };

const nonPoolerUrl = process.env.DATABASE_URL?.replace('-pooler', '');

async function simulate() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to Mongo');

        // Use custom pool for testing
        const { Pool } = require('pg');
        const testPool = new Pool({
            connectionString: nonPoolerUrl,
            ssl: { rejectUnauthorized: false }
        });
        
        const testQuery = (text: string, params?: any[]) => testPool.query(text, params);
        const limit = 10;
        const offset = 0;
        const status = undefined;

        let queryStr = 'SELECT o.* FROM orders o';
        let countQueryStr = 'SELECT COUNT(*) FROM orders o';
        const params: any[] = [];
        const whereClauses: string[] = [];

        // Skip ownership check if superadmin (as in routes)
        if (mockUser.role === 'admin') {
            const myProducts = await Product.find({ addedBy: mockUser.id }, '_id');
            const myProductIds = myProducts.map(p => p._id.toString());
            if (myProductIds.length === 0) {
                console.log('No products for admin'); return;
            }
            queryStr = 'SELECT DISTINCT o.* FROM orders o JOIN order_items oi ON o.id = oi.order_id';
            countQueryStr = 'SELECT COUNT(DISTINCT o.id) FROM orders o JOIN order_items oi ON o.id = oi.order_id';
            whereClauses.push(`oi.product_id = ANY($${params.length + 1})`);
            params.push(myProductIds);
        }

        if (status) {
            whereClauses.push(`o.status = $${params.length + 1}`);
            params.push(status);
        }

        if (whereClauses.length > 0) {
            const whereStr = ' WHERE ' + whereClauses.join(' AND ');
            queryStr += whereStr;
            countQueryStr += whereStr;
        }

        queryStr += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Number(limit), Number(offset));

        console.log('Executing query:', queryStr);
        console.log('Params:', params);
        
        const res = await testQuery(queryStr, params);
        console.log('Results count:', res.rows.length);
        
        const countRes = await testQuery(countQueryStr, params.slice(0, params.length - 2));
        console.log('Total count:', countRes.rows[0].count);

        await testPool.end();
        await mongoose.disconnect();
    } catch (err: any) {
        console.error('SIMULATION FAILED:', err.message);
        console.error(err.stack);
    }
}

simulate();
