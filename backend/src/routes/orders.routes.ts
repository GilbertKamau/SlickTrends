import { Router, Response } from 'express';
import { query } from '../config/db.postgres';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';
import Product from '../models/Product';
import { v4 as uuidv4 } from 'uuid';
import {
    sendOrderConfirmationEmail,
    sendOrderDispatchedEmail,
    sendOrderDeliveredEmail,
    sendOrderClosedEmail,
    sendOrderCancelledEmail,
} from '../services/email.service';
import { cacheFlushPattern } from '../config/redis';
import axios from 'axios';

// Helper: clear abandoned cart record after order placed
async function clearAbandonedCart(email: string) {
    try {
        const apiBase = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
        await axios.post(`${apiBase}/api/n8n/clear-cart`, { userEmail: email });
    } catch { /* silent */ }
}


const router = Router();

// POST /api/orders - Customer creates order
router.post('/', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { items, shippingAddress, notes } = req.body;
        if (!items || !items.length || !shippingAddress) {
            res.status(400).json({ success: false, message: 'Items and shipping address required.' }); return;
        }

        // Verify stock and calculate totals
        let subtotal = 0;
        const orderItems = [];
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || !product.isActive) {
                res.status(400).json({ success: false, message: `Product ${item.productId} not found.` }); return;
            }
            if (product.stock < item.quantity) {
                res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` }); return;
            }
            const totalPrice = product.price * item.quantity;
            subtotal += totalPrice;
            orderItems.push({ productId: product._id.toString(), productName: product.name, productImage: product.images[0] || '', category: product.category, size: product.size, condition: product.condition, quantity: item.quantity, unitPrice: product.price, totalPrice });
        }

        const shippingFee = subtotal > 5000 ? 0 : 200;
        const total = subtotal + shippingFee;

        // Insert order into PostgreSQL
        const orderId = uuidv4();
        await query(
            `INSERT INTO orders (id, user_id, user_name, user_email, status, subtotal, shipping_fee, total, shipping_address, notes)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9)`,
            [orderId, req.user!.id, req.body.userName || 'Customer', req.user!.email, subtotal, shippingFee, total, JSON.stringify(shippingAddress), notes || null]
        );

        // Insert order items
        for (const item of orderItems) {
            await query(
                `INSERT INTO order_items (order_id, product_id, product_name, product_image, category, size, condition, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [orderId, item.productId, item.productName, item.productImage, item.category, item.size, item.condition, item.quantity, item.unitPrice, item.totalPrice]
            );
            // Decrement stock
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
        }

        const order = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
        const orderItemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);

        res.status(201).json({ success: true, order: { ...order.rows[0], items: orderItemsRes.rows } });

        // ─── Non-blocking: send confirmation email + clear abandoned cart ──
        (async () => {
            try {
                const emailItems = orderItems.map(i => ({ name: i.productName, quantity: i.quantity, price: i.unitPrice }));
                await sendOrderConfirmationEmail(req.user!.email, req.body.userName || req.user!.email, orderId, emailItems, total);
            } catch (e) { console.warn('Order email failed:', e); }
            try { await clearAbandonedCart(req.user!.email); } catch { /* silent */ }
        })();
        // ─── Invalidate product cache (stock changed) ──────────────────────
        await cacheFlushPattern('products:*');
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});


// GET /api/orders/my - Customer's orders
router.get('/my', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orders = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user!.id]);
        res.json({ success: true, orders: orders.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/orders/my/:id - Single order with items
router.get('/my/:id', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orderRes = await query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [req.params.id, req.user!.id]);
        if (!orderRes.rows.length) { res.status(404).json({ success: false, message: 'Order not found.' }); return; }
        const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
        res.json({ success: true, order: { ...orderRes.rows[0], items: itemsRes.rows } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/orders - Admin: all orders
router.get('/', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);
        
        let queryStr = 'SELECT o.* FROM orders o';
        let countQueryStr = 'SELECT COUNT(*) FROM orders o';
        const params: unknown[] = [];
        const whereClauses: string[] = [];

        if (req.user!.role === 'admin') {
            const myProducts = await Product.find({ addedBy: req.user!.id }, '_id');
            const myProductIds = myProducts.map(p => p._id.toString());
            
            if (myProductIds.length === 0) {
                res.json({ success: true, orders: [], total: 0 });
                return;
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

        const orders = await query(queryStr, params);
        const countRes = await query(countQueryStr, params.slice(0, params.length - 2));
        
        console.log(`[DEBUG] Found ${countRes.rows[0].count} orders for admin.`);
        res.json({ success: true, orders: orders.rows, total: Number(countRes.rows[0].count) });
    } catch (err) {
        console.error('[ERROR] Order fetch error:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/orders/:id - Admin: single order
router.get('/:id', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orderRes = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (!orderRes.rows.length) { res.status(404).json({ success: false, message: 'Order not found.' }); return; }
        
        const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
        
        // Ownership check for admin
        if (req.user!.role === 'admin') {
            const myProducts = await Product.find({ addedBy: req.user!.id }, '_id');
            const myProductIds = myProducts.map(p => p._id.toString());
            const hasMyProduct = itemsRes.rows.some(item => myProductIds.includes(item.product_id));
            if (!hasMyProduct) {
                res.status(403).json({ success: false, message: 'Access denied. This order does not contain your products.' });
                return;
            }
        }

        const txRes = await query('SELECT * FROM transactions WHERE order_id = $1', [req.params.id]);
        res.json({ success: true, order: { ...orderRes.rows[0], items: itemsRes.rows, transactions: txRes.rows } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PATCH /api/orders/:id/status - Admin: update order status + fire email
router.patch('/:id/status', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { status, cancellationReason } = req.body;
        const validStatuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled', 'closed'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid status.' }); return;
        }

        // Fetch current order for email data
        const existing = await query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (!existing.rows.length) {
            res.status(404).json({ success: false, message: 'Order not found.' }); return;
        }
        const order = existing.rows[0];

        // Ownership check for admin
        if (req.user!.role === 'admin') {
            const itemsRes = await query('SELECT product_id FROM order_items WHERE order_id = $1', [req.params.id]);
            const myProducts = await Product.find({ addedBy: req.user!.id }, '_id');
            const myProductIds = myProducts.map(p => p._id.toString());
            const hasMyProduct = itemsRes.rows.some(item => myProductIds.includes(item.product_id));
            if (!hasMyProduct) {
                res.status(403).json({ success: false, message: 'Access denied. This order does not contain your products.' });
                return;
            }
        }

        let updateQuery = 'UPDATE orders SET status = $1, updated_at = NOW()';
        const params: unknown[] = [status, req.params.id];
        if (status === 'dispatched') { updateQuery += `, dispatched_at = NOW(), dispatched_by = $3`; params.push(req.user!.id); }
        if (status === 'delivered') { updateQuery += ', delivered_at = NOW()'; }
        if (status === 'closed') { updateQuery += ', closed_at = NOW()'; }
        updateQuery += ` WHERE id = $2 RETURNING *`;
        const result = await query(updateQuery, params);

        res.json({ success: true, order: result.rows[0] });

        // ─── Fire email non-blocking ───────────────────────────────────────
        const to = order.user_email;
        const name = order.user_name || 'Customer';
        const id = order.id;
        const total = Number(order.total);

        (async () => {
            try {
                if (status === 'dispatched') await sendOrderDispatchedEmail(to, name, id, total);
                if (status === 'delivered') await sendOrderDeliveredEmail(to, name, id);
                if (status === 'closed') await sendOrderClosedEmail(to, name, id);
                if (status === 'cancelled') await sendOrderCancelledEmail(to, name, id, cancellationReason);
            } catch (emailErr) {
                console.warn('⚠️  Email send failed (non-critical):', emailErr);
            }
        })();

        // ─── Invalidate analytics cache ────────────────────────────────────
        await cacheFlushPattern('superadmin:*');
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/orders — also sends confirmation email after creation
// (Overwrite the router.post with email-firing version)


export default router;
