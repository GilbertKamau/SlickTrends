import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import rateLimit from 'express-rate-limit';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { sendWelcomeEmail } from '../services/email.service';

const router = Router();

// Strict rate limit for auth routes to prevent brute force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login/register requests per window
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generateToken = (id: string, email: string, role: string): string => {
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET as string, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
};

// POST /api/auth/register
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email and password are required.' });
            return;
        }
        const exists = await User.findOne({ email });
        if (exists) {
            res.status(409).json({ success: false, message: 'Email already registered.' });
            return;
        }
        const user = await User.create({ name, email, password, phone, role: 'customer' });
        const token = generateToken(user._id.toString(), user.email, user.role);

        // Non-blocking welcome email
        sendWelcomeEmail(user.email, user.name).catch(e => console.warn('Welcome email failed:', e));

        res.status(201).json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' });
            return;
        }
        const user = await User.findOne({ email });
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' });
            return;
        }
        const token = generateToken(user._id.toString(), user.email, user.role);
        res.json({
            success: true,
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

// GET /api/auth/me
router.get('/me', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user!.id).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, phone, address, avatar } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user!.id,
            { name, phone, address, avatar },
            { new: true, select: '-password' }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user!.id);
        if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) { res.status(400).json({ success: false, message: 'Current password incorrect.' }); return; }
        user.password = newPassword;
        await user.save();
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Admin: Create admin/superadmin user
router.post('/create-staff', protect, requireRole('superadmin'), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;
        if (!['admin', 'superadmin'].includes(role)) {
            res.status(400).json({ success: false, message: 'Invalid role.' }); return;
        }
        const exists = await User.findOne({ email });
        if (exists) { res.status(409).json({ success: false, message: 'Email already registered.' }); return; }
        const user = await User.create({ name, email, password, role });
        res.status(201).json({ success: true, message: 'Staff account created.', user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

export default router;
