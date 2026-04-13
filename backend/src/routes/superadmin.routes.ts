import { Router, Response } from 'express';
import { query } from '../config/db.postgres';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/superadmin/metrics - Dashboard metrics
router.get('/metrics', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const [
            totalOrdersRes, revenueRes, pendingRes, dispatchedRes, completedRes, cancelledRes,
            todayRevenueRes, monthlyRevenueRes, txByMethodRes
        ] = await Promise.all([
            query('SELECT COUNT(*) FROM orders'),
            query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed'`),
            query(`SELECT COUNT(*) FROM orders WHERE status = 'pending'`),
            query(`SELECT COUNT(*) FROM orders WHERE status = 'dispatched'`),
            query(`SELECT COUNT(*) FROM orders WHERE status IN ('delivered', 'closed')`),
            query(`SELECT COUNT(*) FROM orders WHERE status = 'cancelled'`),
            query(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'completed' AND DATE(created_at) = CURRENT_DATE`),
            query(`SELECT TO_CHAR(created_at, 'YYYY-MM') as month, SUM(amount) as revenue FROM transactions WHERE status = 'completed' GROUP BY month ORDER BY month DESC LIMIT 12`),
            query(`SELECT payment_method, COUNT(*) as count, SUM(amount) as total FROM transactions WHERE status = 'completed' GROUP BY payment_method`),
        ]);

        const [totalProductsRes, totalUsersRes, lowStockProductsRes, categoryStatsRes] = await Promise.all([
            query('SELECT COUNT(*) FROM products WHERE is_active = true'),
            query("SELECT COUNT(*) FROM users WHERE role = 'customer'"),
            query('SELECT COUNT(*) FROM products WHERE is_active = true AND stock <= 5'),
            query('SELECT category as "_id", COUNT(*) as count, SUM(stock) as "totalStock", AVG(price) as "avgPrice" FROM products WHERE is_active = true GROUP BY category')
        ]);

        res.json({
            success: true,
            metrics: {
                orders: {
                    total: Number(totalOrdersRes.rows[0].count),
                    pending: Number(pendingRes.rows[0].count),
                    dispatched: Number(dispatchedRes.rows[0].count),
                    completed: Number(completedRes.rows[0].count),
                    cancelled: Number(cancelledRes.rows[0].count),
                },
                revenue: {
                    total: parseFloat(revenueRes.rows[0].total),
                    today: parseFloat(todayRevenueRes.rows[0].total),
                    monthly: monthlyRevenueRes.rows,
                },
                payments: { byMethod: txByMethodRes.rows },
                products: { 
                    total: Number(totalProductsRes.rows[0].count), 
                    lowStock: Number(lowStockProductsRes.rows[0].count), 
                    byCategory: categoryStatsRes.rows 
                },
                users: { customers: Number(totalUsersRes.rows[0].count) },
            },
        });
    } catch (err: any) {
        console.error('❌ Superadmin metrics fetch failed:', err.message);
        require('fs').appendFileSync('error.log', `[${new Date().toISOString()}] Superadmin metrics fetch failed: ${err.message}\n${err.stack}\n\n`);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

// GET /api/superadmin/users - All users
router.get('/users', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, page = 1, limit = 20 } = req.query;
        let whereSql = '';
        const params: unknown[] = [];
        if (role) {
            params.push(role);
            whereSql = 'WHERE role = $1';
        }
        
        const skip = (Number(page) - 1) * Number(limit);
        
        const countRes = await query(`SELECT COUNT(*) FROM users ${whereSql}`, params);
        const total = Number(countRes.rows[0].count);

        params.push(Number(limit), skip);
        const usersRes = await query(`SELECT id, name, email, role, phone, is_verified, is_active, created_at FROM users ${whereSql} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
        
        res.json({ success: true, users: usersRes.rows, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err: any) {
        console.error('❌ Superadmin users fetch failed:', err.message);
        require('fs').appendFileSync('error.log', `[${new Date().toISOString()}] Superadmin users fetch failed: ${err.message}\n${err.stack}\n\n`);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

// PATCH /api/superadmin/users/:id/status
router.patch('/users/:id/status', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { isActive } = req.body;
        await query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [isActive, req.params.id]);
        res.json({ success: true, message: `User ${isActive ? 'activated' : 'deactivated'}.` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/superadmin/transactions - All transactions
router.get('/transactions', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { method, status, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        let queryStr = 'SELECT t.*, o.user_name, o.user_email FROM transactions t JOIN orders o ON t.order_id = o.id WHERE 1=1';
        const params: unknown[] = [];
        if (method) { queryStr += ` AND t.payment_method = $${params.length + 1}`; params.push(method); }
        if (status) { queryStr += ` AND t.status = $${params.length + 1}`; params.push(status); }
        queryStr += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);
        const txRes = await query(queryStr, params);
        res.json({ success: true, transactions: txRes.rows });
    } catch (err: any) {
        console.error('❌ Superadmin transactions fetch failed:', err.message);
        require('fs').appendFileSync('error.log', `[${new Date().toISOString()}] Superadmin transactions fetch failed: ${err.message}\n${err.stack}\n\n`);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

// GET /api/superadmin/sales-trend - Daily sales for chart
router.get('/sales-trend', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { days = 30 } = req.query;
        const res2 = await query(
            `SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(amount) as revenue
       FROM transactions WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '${Number(days)} days'
       GROUP BY DATE(created_at) ORDER BY date ASC`
        );
        res.json({ success: true, trend: res2.rows });
    } catch (err: any) {
        console.error('❌ Superadmin sales-trend fetch failed:', err.message);
        require('fs').appendFileSync('error.log', `[${new Date().toISOString()}] Superadmin sales-trend fetch failed: ${err.message}\n${err.stack}\n\n`);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

export default router;
