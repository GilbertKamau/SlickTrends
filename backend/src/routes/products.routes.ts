import { Router, Response } from 'express';
import Product from '../models/Product';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// GET /api/products - List all (with filters)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, size, condition, minPrice, maxPrice, search, featured, page = 1, limit = 12 } = req.query;
        const filter: Record<string, unknown> = { isActive: true };
        if (category) filter.category = category;
        if (size) filter.size = size;
        if (condition) filter.condition = condition;
        if (featured === 'true') filter.isFeatured = true;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) (filter.price as Record<string, number>)['$gte'] = Number(minPrice);
            if (maxPrice) (filter.price as Record<string, number>)['$lte'] = Number(maxPrice);
        }
        if (search) filter['$text'] = { $search: search as string };
        const skip = (Number(page) - 1) * Number(limit);
        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('addedBy', 'name'),
            Product.countDocuments(filter),
        ]);
        res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

// GET /api/products/:id
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('addedBy', 'name');
        if (!product) { res.status(404).json({ success: false, message: 'Product not found.' }); return; }
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// POST /api/products - Admin adds product
router.post('/', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const product = await Product.create({ ...req.body, addedBy: req.user!.id });
        res.status(201).json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

// PUT /api/products/:id - Admin updates product
router.put('/:id', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter: any = { _id: req.params.id };
        if (req.user!.role === 'admin') filter.addedBy = req.user!.id;
        
        const product = await Product.findOneAndUpdate(filter, req.body, { new: true });
        if (!product) { res.status(404).json({ success: false, message: 'Product not found or access denied.' }); return; }
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PATCH /api/products/:id/stock - Admin updates stock
router.patch('/:id/stock', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { stock } = req.body;
        const filter: any = { _id: req.params.id };
        if (req.user!.role === 'admin') filter.addedBy = req.user!.id;

        const product = await Product.findOneAndUpdate(filter, { stock }, { new: true });
        if (!product) { res.status(404).json({ success: false, message: 'Product not found or access denied.' }); return; }
        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// DELETE /api/products/:id - Soft delete
router.delete('/:id', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filter: any = { _id: req.params.id };
        if (req.user!.role === 'admin') filter.addedBy = req.user!.id;

        const product = await Product.findOneAndUpdate(filter, { isActive: false });
        if (!product) { res.status(404).json({ success: false, message: 'Product not found or access denied.' }); return; }
        res.json({ success: true, message: 'Product removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// GET /api/products/admin/all - Admin sees all including inactive
router.get('/admin/all', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        const filter: any = {};
        if (req.user!.role === 'admin') filter.addedBy = req.user!.id;

        console.log(`[DEBUG] Fetching admin products. Filter:`, filter);

        const [products, total] = await Promise.all([
            Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('addedBy', 'name'),
            Product.countDocuments(filter),
        ]);
        
        console.log(`[DEBUG] Found ${total} products for admin.`);
        res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error('[ERROR] Admin products fetch failed:', err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

export default router;
