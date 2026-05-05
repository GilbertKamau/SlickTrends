import { Router, Response } from 'express';
import { query } from '../config/db.postgres';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import AdmZip from 'adm-zip';
import cloudinary from '../config/cloudinary';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit for zip

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { category, size, condition, minPrice, maxPrice, search, featured, page = 1, limit = 12 } = req.query;
        let whereClauses = ['p.is_active = true'];
        const params: unknown[] = [];
        
        if (category) { params.push(category); whereClauses.push(`p.category = $${params.length}`); }
        if (size) { params.push(size); whereClauses.push(`p.size = $${params.length}`); }
        if (condition) { params.push(condition); whereClauses.push(`p.condition = $${params.length}`); }
        if (featured === 'true') { whereClauses.push('p.is_featured = true'); }
        if (minPrice) { params.push(Number(minPrice)); whereClauses.push(`p.price >= $${params.length}`); }
        if (maxPrice) { params.push(Number(maxPrice)); whereClauses.push(`p.price <= $${params.length}`); }
        if (search) { 
            params.push(`%${search}%`); 
            whereClauses.push(`(p.name ILIKE $${params.length} OR p.description ILIKE $${params.length} OR p.tags::text ILIKE $${params.length})`); 
        }

        const skip = (Number(page) - 1) * Number(limit);
        const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

        const countRes = await query(`SELECT COUNT(*) FROM products p ${whereSql}`, params);
        const total = Number(countRes.rows[0].count);

        params.push(Number(limit), skip);
        const productsRes = await query(
            `SELECT p.*, row_to_json(u) as "addedBy" 
             FROM products p 
             LEFT JOIN (SELECT id, name FROM users) u ON p.added_by = u.id 
             ${whereSql} 
             ORDER BY p.created_at DESC 
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({ success: true, products: productsRes.rows, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const productRes = await query(
            `SELECT p.*, row_to_json(u) as "addedBy" 
             FROM products p 
             LEFT JOIN (SELECT id, name FROM users) u ON p.added_by = u.id 
             WHERE p.id = $1 AND p.is_active = true`,
            [req.params.id]
        );
        if (productRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Product not found.' }); return; }
        res.json({ success: true, product: productRes.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.post('/', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = uuidv4();
        const p = req.body;
        const productRes = await query(
            `INSERT INTO products (id, name, description, category, size, condition, price, original_price, stock, images, brand, color, material, is_featured, is_active, added_by, tags, is_sold, sold_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
            [id, p.name, p.description, p.category, p.size, p.condition, p.price, p.originalPrice || null, p.stock || 0, JSON.stringify(p.images || []), p.brand || null, p.color || null, p.material || null, p.isFeatured || false, p.isActive !== false, req.user!.id, JSON.stringify(p.tags || []), p.isSold || false, p.soldAt || null]
        );
        res.status(201).json({ success: true, product: productRes.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

router.put('/:id', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const p = req.body;
        let authCheck = '';
        const params: any[] = [p.name, p.description, p.category, p.size, p.condition, p.price, p.originalPrice || null, p.stock || 0, JSON.stringify(p.images || []), p.brand || null, p.color || null, p.material || null, p.isFeatured || false, p.isActive !== false, JSON.stringify(p.tags || []), p.isSold || false, p.soldAt || null, req.params.id];
        
        if (req.user!.role === 'admin') {
            authCheck = ` AND added_by = $${params.length + 1}`;
            params.push(req.user!.id);
        }

        const productRes = await query(
            `UPDATE products SET name=$1, description=$2, category=$3, size=$4, condition=$5, price=$6, original_price=$7, stock=$8, images=$9, brand=$10, color=$11, material=$12, is_featured=$13, is_active=$14, tags=$15, is_sold=$16, sold_at=$17, updated_at=NOW()
             WHERE id=$18${authCheck} RETURNING *`,
            params
        );
        
        if (productRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Product not found or access denied.' }); return; }
        res.json({ success: true, product: productRes.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.patch('/:id/stock', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { stock } = req.body;
        let authCheck = '';
        const params: any[] = [stock, req.params.id];
        if (req.user!.role === 'admin') {
            authCheck = ' AND added_by = $3';
            params.push(req.user!.id);
        }

        const productRes = await query(`UPDATE products SET stock=$1, updated_at=NOW() WHERE id=$2${authCheck} RETURNING *`, params);
        if (productRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Product not found or access denied.' }); return; }
        res.json({ success: true, product: productRes.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.delete('/:id', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let authCheck = '';
        const params: any[] = [req.params.id];
        if (req.user!.role === 'admin') {
            authCheck = ' AND added_by = $2';
            params.push(req.user!.id);
        }

        const productRes = await query(`UPDATE products SET is_active=false, updated_at=NOW() WHERE id=$1${authCheck} RETURNING id`, params);
        if (productRes.rows.length === 0) { res.status(404).json({ success: false, message: 'Product not found or access denied.' }); return; }
        res.json({ success: true, message: 'Product removed.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.get('/admin/all', protect as any, requireRole('admin', 'superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { page = 1, limit = 20 } = req.query;
        let whereSql = '';
        const params: unknown[] = [];
        
        if (req.user!.role === 'admin') {
            params.push(req.user!.id);
            whereSql = `WHERE p.added_by = $1`;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const countRes = await query(`SELECT COUNT(*) FROM products p ${whereSql}`, params);
        const total = Number(countRes.rows[0].count);

        params.push(Number(limit), skip);
        const productsRes = await query(
            `SELECT p.*, row_to_json(u) as "addedBy" 
             FROM products p 
             LEFT JOIN (SELECT id, name FROM users) u ON p.added_by = u.id 
             ${whereSql} 
             ORDER BY p.created_at DESC 
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({ success: true, products: productsRes.rows, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err: any) {
        res.status(500).json({ success: false, message: 'Failed to fetch admin products.', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

router.post('/bulk-zip', protect as any, requireRole('admin', 'superadmin') as any, upload.single('zipfile'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No zip file provided.' });
            return;
        }

        const zip = new AdmZip(req.file.buffer);
        const zipEntries = zip.getEntries();
        
        const productsJsonEntry = zipEntries.find(entry => entry.entryName.endsWith('products.json'));
        if (!productsJsonEntry) {
            res.status(400).json({ success: false, message: 'products.json not found in the zip file.' });
            return;
        }

        const productsJsonStr = productsJsonEntry.getData().toString('utf8');
        let products: any[];
        try {
            products = JSON.parse(productsJsonStr);
        } catch (e) {
            res.status(400).json({ success: false, message: 'Invalid JSON in products.json.' });
            return;
        }

        const addedProducts = [];
        const failedProducts = [];

        for (const p of products) {
            try {
                // Find and upload images
                const uploadedImages = [];
                if (p.images && Array.isArray(p.images)) {
                    for (const imgName of p.images) {
                        const imgEntry = zipEntries.find(entry => entry.name === imgName || entry.entryName.endsWith(imgName));
                        if (imgEntry) {
                            const buffer = imgEntry.getData();
                            // Determine mimetype from extension
                            const ext = imgName.split('.').pop()?.toLowerCase();
                            const mimetype = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
                            const b64 = buffer.toString('base64');
                            const dataURI = `data:${mimetype};base64,${b64}`;
                            
                            const result = await cloudinary.uploader.upload(dataURI, {
                                folder: 'slick-trends/products',
                                resource_type: 'auto',
                            });
                            uploadedImages.push(result.secure_url);
                        }
                    }
                }

                const params: any[] = [
                    p.name, 
                    p.description || '', 
                    p.category || 'Uncategorized', 
                    p.size || 'M', 
                    p.condition || 'Good', 
                    p.price || 0, 
                    p.originalPrice || null, 
                    p.stockQuantity !== undefined ? p.stockQuantity : (p.stock || 0), 
                    JSON.stringify(uploadedImages), 
                    p.brand || null, 
                    p.color || null, 
                    p.material || null, 
                    p.featured || p.isFeatured || false, 
                    req.user!.id, 
                    JSON.stringify(p.tags || [])
                ];

                const productRes = await query(
                    `INSERT INTO products (name, description, category, size, condition, price, original_price, stock, images, brand, color, material, is_featured, added_by, tags)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
                    params
                );
                addedProducts.push(productRes.rows[0]);
            } catch (err: any) {
                console.error(`Error adding product ${p.name}:`, err);
                failedProducts.push({ name: p.name, error: err.message });
            }
        }

        res.json({ success: true, added: addedProducts.length, failed: failedProducts.length, details: failedProducts });
    } catch (err: any) {
        console.error('Bulk upload error:', err);
        res.status(500).json({ success: false, message: 'Failed to process bulk upload.', error: err.message });
    }
});

export default router;
