import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import rateLimit from 'express-rate-limit';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail } from '../services/email.service';
import crypto from 'crypto';
import passport from 'passport';

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
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const user = await User.create({ name, email, password, phone, role: 'customer', otp, otpExpire });
        const token = generateToken(user._id.toString(), user.email, user.role);

        // Non-blocking emails
        sendWelcomeEmail(user.email, user.name).catch(e => console.warn('Welcome email failed:', e));
        sendOTPEmail(user.email, user.name, otp).catch(e => console.warn('OTP email failed:', e));

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
router.get('/me', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = await User.findById(req.user!.id).select('-password');
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/auth/profile
router.put('/profile', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, phone, address, avatar, paymentDetails } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user!.id,
            { name, phone, address, avatar, paymentDetails },
            { new: true, select: '-password' }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// PUT /api/auth/change-password
router.put('/change-password', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
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
router.post('/create-staff', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
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

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email, otp, otpExpire: { $gt: new Date() } });
        if (!user) { res.status(400).json({ success: false, message: 'Invalid or expired OTP.' }); return; }
        
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        await user.save();
        
        res.json({ success: true, message: 'Email verified successfully.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, user.name, resetUrl);

        res.json({ success: true, message: 'Reset email sent.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token as string).digest('hex');
        const user = await User.findOne({ resetPasswordToken, resetPasswordExpire: { $gt: new Date() } });
        if (!user) { res.status(400).json({ success: false, message: 'Invalid or expired token.' }); return; }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successful.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

// ─── Google OAuth ───
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/callback/google', passport.authenticate('google', { session: false }), (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken(user._id.toString(), user.email, user.role);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
});

// ─── Microsoft OAuth ───
router.get('/microsoft', passport.authenticate('microsoft'));

router.get('/microsoft/callback', passport.authenticate('microsoft', { session: false }), (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken(user._id.toString(), user.email, user.role);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
});

export default router;
