import { Router, Response } from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Store file in memory so we can upload it directly to Cloudinary
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// POST /api/upload - Admin/Superadmin only
router.post('/', protect, requireRole('admin', 'superadmin'), upload.single('image'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: 'No image file provided.' });
            return;
        }

        // Convert buffer to base64 Data URI
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'slick-trends/products',
            resource_type: 'auto',
        });

        res.status(200).json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (err: unknown) {
        console.error('Cloudinary upload error:', err);
        res.status(500).json({ success: false, message: 'Failed to upload image.', error: err });
    }
});

export default router;
