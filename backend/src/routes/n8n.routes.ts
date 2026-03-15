import express, { Router, Request, Response } from 'express';
import { query } from '../config/db.postgres';

import { sendAbandonedCartEmail } from '../services/email.service';

const router: Router = express.Router();

// ─── Secret token guard ────────────────────────────────────────────────────────
const verifyN8nToken = (req: Request, res: Response, next: Function) => {
    const token = req.headers['x-n8n-secret'] || req.query.secret;
    if (token !== process.env.N8N_SECRET) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    next();
};

/**
 * POST /api/n8n/abandoned-cart
 * Called by n8n workflow every hour.
 * Finds carts that:
 *  - Were last updated > 2 hours ago
 *  - Have NOT been converted into an order yet
 * Sends a personalized recovery email to each user.
 */
router.post('/abandoned-cart', verifyN8nToken, async (req: Request, res: Response) => {
    try {
        // We track abandoned carts in a lightweight PostgreSQL table
        const result = await query(`
      SELECT ac.user_id, ac.user_email, ac.user_name, ac.items, ac.total_value, ac.updated_at
      FROM abandoned_carts ac
      LEFT JOIN orders o ON o.user_email = ac.user_email 
        AND o.created_at > ac.updated_at
      WHERE o.id IS NULL
        AND ac.updated_at < NOW() - INTERVAL '2 hours'
        AND ac.email_sent = false
        AND ac.total_value > 0
      LIMIT 50
    `);
        const rows = result.rows;

        const sent: string[] = [];
        for (const cart of rows) {
            try {
                const items = typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items;
                await sendAbandonedCartEmail(cart.user_email, cart.user_name, items, cart.total_value);

                // Mark as email sent so we don't spam
                await query(
                    `UPDATE abandoned_carts SET email_sent = true, email_sent_at = NOW() WHERE user_email = $1`,
                    [cart.user_email]
                );
                sent.push(cart.user_email);
            } catch (err) {
                console.error('Failed to send abandoned cart email to', cart.user_email, err);
            }
        }

        res.json({ success: true, emailsSent: sent.length, recipients: sent });
    } catch (err) {
        console.error('Abandoned cart job error:', err);
        res.status(500).json({ success: false, message: 'Job failed' });
    }
});

import { protect, AuthRequest } from '../middleware/auth.middleware';

/**
 * POST /api/n8n/cart-heartbeat
 * Called by the frontend every time the cart changes.
 * Upserts the cart state in the abandoned_carts table.
 */
router.post('/cart-heartbeat', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId, userEmail, userName, items, totalValue } = req.body;

    // Strict isolation: users can only update their own cart
    if (!userEmail || userEmail !== req.user?.email || !items) {
        res.status(403).json({ success: false, message: 'Unauthorized cart operation' });
        return;
    }

    try {
        await query(`
      INSERT INTO abandoned_carts (user_id, user_email, user_name, items, total_value, updated_at, email_sent)
      VALUES ($1, $2, $3, $4, $5, NOW(), false)
      ON CONFLICT (user_email)
      DO UPDATE SET items = $4, total_value = $5, updated_at = NOW(), email_sent = false
    `, [req.user!.id || userId, userEmail, userName || req.user!.email, JSON.stringify(items), totalValue]);

        if (!items || items.length === 0) {
            // Cart cleared — remove
            await query('DELETE FROM abandoned_carts WHERE user_email = $1', [userEmail]);
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

/**
 * POST /api/n8n/clear-cart
 * Called when a successful order is placed, to clear the abandoned cart record.
 */
router.post('/clear-cart', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    const { userEmail } = req.body;

    // Strict isolation: users can only clear their own cart
    if (!userEmail || userEmail !== req.user?.email) {
        res.status(403).json({ success: false, message: 'Unauthorized cart operation' });
        return;
    }

    try {
        await query('DELETE FROM abandoned_carts WHERE user_email = $1', [userEmail]);
        res.json({ success: true });
    } catch {
        res.status(500).json({ success: false });
    }
});

/**
 * GET /api/n8n/health
 * Health check for n8n to confirm the webhook is alive.
 */
router.get('/health', (_, res) => {
    res.json({ success: true, service: 'n8n-webhooks', timestamp: new Date().toISOString() });
});

export default router;
