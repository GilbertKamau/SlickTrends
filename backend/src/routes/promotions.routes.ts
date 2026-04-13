import { Router, Response } from 'express';
import { query } from '../config/db.postgres';
import { sendPromotionEmail } from '../services/email.service';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/active', async (req, res: Response): Promise<void> => {
    try {
        const promotionsRes = await query(
            `SELECT * FROM promotions 
             WHERE is_active = true 
             AND (start_date IS NULL OR start_date <= NOW())
             AND (end_date IS NULL OR end_date >= NOW())
             ORDER BY created_at DESC`
        );
        res.json({ success: true, promotions: promotionsRes.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.get('/', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promotionsRes = await query('SELECT * FROM promotions ORDER BY created_at DESC');
        res.json({ success: true, promotions: promotionsRes.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.post('/', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, subtitle, imageUrl, link, isActive, type, startDate, endDate } = req.body;
        const id = uuidv4();
        const promoRes = await query(
            `INSERT INTO promotions (id, title, subtitle, image_url, link, is_active, type, start_date, end_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [id, title, subtitle || null, imageUrl, link || '#', isActive !== undefined ? isActive : true, type || 'holiday', startDate || null, endDate || null]
        );
        res.status(201).json({ success: true, promotion: promoRes.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

router.put('/:id', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { title, subtitle, imageUrl, link, isActive, type, startDate, endDate } = req.body;
        const promoRes = await query(
            `UPDATE promotions 
             SET title = COALESCE($1, title), subtitle = $2, image_url = COALESCE($3, image_url), 
                 link = COALESCE($4, link), is_active = COALESCE($5, is_active), type = COALESCE($6, type), 
                 start_date = $7, end_date = $8, updated_at = NOW() 
             WHERE id = $9 RETURNING *`,
            [title, subtitle || null, imageUrl, link, isActive, type, startDate || null, endDate || null, req.params.id]
        );
        if (promoRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Promotion not found.' }); return; }
        res.json({ success: true, promotion: promoRes.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.delete('/:id', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promoRes = await query('DELETE FROM promotions WHERE id = $1 RETURNING id', [req.params.id]);
        if (promoRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Promotion not found.' }); return; }
        res.json({ success: true, message: 'Promotion deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.post('/:id/broadcast', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promoRes = await query('SELECT * FROM promotions WHERE id = $1 AND is_active = true', [req.params.id]);
        if (promoRes.rows.length === 0) {
            res.status(400).json({ success: false, message: 'Active promotion not found.' }); return;
        }
        const promo = promoRes.rows[0];

        const usersRes = await query("SELECT email, name FROM users WHERE is_verified = true AND role = 'customer'");
        const users = usersRes.rows;

        res.json({ success: true, message: `Broadcast started for ${users.length} users.` });

        (async () => {
            let successCount = 0;
            let failCount = 0;
            for (const user of users) {
                try {
                    await sendPromotionEmail(user.email, user.name, promo.title, promo.subtitle || '', undefined, promo.image_url);
                    successCount++;
                } catch (e) {
                    failCount++;
                }
            }
            console.log(`[Broadcast] Done. Success: ${successCount}, Failed: ${failCount}`);
        })();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

export default router;
