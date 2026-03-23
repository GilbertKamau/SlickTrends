import { Router, Response } from 'express';
import { query } from '../config/db.postgres';
import Product from '../models/Product';
import User from '../models/User';
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

        const [totalProducts, totalUsers, lowStockProducts] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'customer' }),
            Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
        ]);

        const categoryStats = await Product.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 }, totalStock: { $sum: '$stock' }, avgPrice: { $avg: '$price' } } },
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
                products: { total: totalProducts, lowStock: lowStockProducts, byCategory: categoryStats },
                users: { customers: totalUsers },
            },
        });
    } catch (err: any) {
        console.error('❌ Superadmin metrics fetch failed:', err.message);
        const errorLog = `[${new Date().toISOString()}] Superadmin metrics fetch failed: ${err.message}\n${err.stack}\n\n`;
        require('fs').appendFileSync('error.log', errorLog);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

// GET /api/superadmin/users - All users
router.get('/users', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { role, page = 1, limit = 20 } = req.query;
        const filter: Record<string, unknown> = {};
        if (role) filter.role = role;
        const skip = (Number(page) - 1) * Number(limit);
        const [users, total] = await Promise.all([
            User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
            User.countDocuments(filter),
        ]);
        res.json({ success: true, users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err: any) {
        console.error('❌ Superadmin users fetch failed:', err.message);
        const errorLog = `[${new Date().toISOString()}] Superadmin users fetch failed: ${err.message}\n${err.stack}\n\n`;
        require('fs').appendFileSync('error.log', errorLog);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

// PATCH /api/superadmin/users/:id/status
router.patch('/users/:id/status', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { isActive } = req.body;
        await User.findByIdAndUpdate(req.params.id, { isActive });
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
        const errorLog = `[${new Date().toISOString()}] Superadmin transactions fetch failed: ${err.message}\n${err.stack}\n\n`;
        require('fs').appendFileSync('error.log', errorLog);
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
        const errorLog = `[${new Date().toISOString()}] Superadmin sales-trend fetch failed: ${err.message}\n${err.stack}\n\n`;
        require('fs').appendFileSync('error.log', errorLog);
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
});

export default router;
