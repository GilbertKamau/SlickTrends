import { Router, Response } from 'express';
import Promotion from '../models/Promotion';
import User from '../models/User';
import { sendPromotionEmail } from '../services/email.service';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';




const router = Router();

// GET /api/promotions/active - Public: fetch active deals
router.get('/active', async (req, res: Response): Promise<void> => {
    try {
        const now = new Date();
        const promotions = await Promotion.find({
            isActive: true,
            $and: [
                {
                    $or: [
                        { startDate: { $exists: false } },
                        { startDate: { $lte: now } }
                    ]
                },
                {
                    $or: [
                        { endDate: { $exists: false } },
                        { endDate: { $gte: now } }
                    ]
                }
            ]
        }).sort({ createdAt: -1 });
        res.json({ success: true, promotions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// ─── Superadmin CRUD ───────────────────────────────────────────────────

// GET /api/promotions - All (Superadmin)
router.get('/', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promotions = await Promotion.find().sort({ createdAt: -1 });
        res.json({ success: true, promotions });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/promotions
router.post('/', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promotion = await Promotion.create(req.body);
        res.status(201).json({ success: true, promotion });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

// PUT /api/promotions/:id
router.put('/:id', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!promotion) { res.status(404).json({ success: false, message: 'Promotion not found.' }); return; }
        res.json({ success: true, promotion });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// DELETE /api/promotions/:id
router.delete('/:id', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promotion = await Promotion.findByIdAndDelete(req.params.id);
        if (!promotion) { res.status(404).json({ success: false, message: 'Promotion not found.' }); return; }
        res.json({ success: true, message: 'Promotion deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/promotions/:id/broadcast - Superadmin: send promo to all verified users
router.post('/:id/broadcast', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const promo = await Promotion.findById(req.params.id);
        if (!promo || !promo.isActive) {
            res.status(400).json({ success: false, message: 'Active promotion not found.' });
            return;
        }

        const users = await User.find({ isVerified: true, role: 'customer' }, 'email name');
        
        // Progress tracking (non-blocking)
        res.json({ success: true, message: `Broadcast started for ${users.length} users.` });

        (async () => {
            let successCount = 0;
            let failCount = 0;
            for (const user of users) {
                try {
                    await sendPromotionEmail(
                        user.email,

                        user.name,
                        promo.title,
                        promo.subtitle || '',
                        undefined, // No coupon code in model yet
                        promo.imageUrl
                    );
                    successCount++;
                } catch (e) {

                    failCount++;
                    console.error(`Broadcast failed for ${user.email}:`, e);
                }
            }
            console.log(`[Broadcast] Done. Success: ${successCount}, Failed: ${failCount}`);
        })();
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});


export default router;
