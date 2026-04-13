import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.postgres';
import rateLimit from 'express-rate-limit';
import { protect, requireRole, AuthRequest } from '../middleware/auth.middleware';
import { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail } from '../services/email.service';
import crypto from 'crypto';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const generateToken = (id: string, email: string, role: string): string => {
    return jwt.sign({ id, email, role }, process.env.JWT_SECRET as string, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    } as jwt.SignOptions);
};

router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Name, email and password are required.' }); return;
        }

        const existsRes = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existsRes.rows.length > 0) {
            res.status(409).json({ success: false, message: 'Email already registered.' }); return;
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        const hashedPass = await bcrypt.hash(password, 12);
        const id = uuidv4();

        await query(
            `INSERT INTO users (id, name, email, password, phone, role, otp, otp_expire) 
             VALUES ($1, $2, $3, $4, $5, 'customer', $6, $7)`,
            [id, name, email, hashedPass, phone || null, otp, otpExpire]
        );

        const token = generateToken(id, email, 'customer');

        sendWelcomeEmail(email, name).catch(e => console.warn('Welcome email failed:', e));
        sendOTPEmail(email, name, otp).catch(e => console.warn('OTP email failed:', e));

        res.status(201).json({
            success: true,
            token,
            user: { id, name, email, role: 'customer', phone },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required.' }); return;
        }

        const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' }); return;
        }

        const user = userRes.rows[0];
        if (!user.is_active) {
            res.status(401).json({ success: false, message: 'Account disabled.' }); return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' }); return;
        }

        const token = generateToken(user.id, user.email, user.role);
        res.json({
            success: true,
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone, avatar: user.avatar },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err });
    }
});

router.get('/me', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userRes = await query('SELECT id, name, email, role, phone, address, avatar, is_verified, is_active, payment_details FROM users WHERE id = $1', [req.user!.id]);
        res.json({ success: true, user: userRes.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.put('/profile', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, phone, address, avatar, paymentDetails } = req.body;
        const result = await query(
            `UPDATE users 
             SET name = COALESCE($1, name), 
                 phone = COALESCE($2, phone), 
                 address = COALESCE($3, address), 
                 avatar = COALESCE($4, avatar), 
                 payment_details = COALESCE($5, payment_details),
                 updated_at = NOW()
             WHERE id = $6 RETURNING id, name, email, role, phone, address, avatar, is_verified, is_active, payment_details`,
            [name, phone, address ? JSON.stringify(address) : null, avatar, paymentDetails ? JSON.stringify(paymentDetails) : null, req.user!.id]
        );
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.put('/change-password', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userRes = await query('SELECT password FROM users WHERE id = $1', [req.user!.id]);
        if (userRes.rows.length === 0) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

        const isMatch = await bcrypt.compare(currentPassword, userRes.rows[0].password);
        if (!isMatch) { res.status(400).json({ success: false, message: 'Current password incorrect.' }); return; }

        const hashedPass = await bcrypt.hash(newPassword, 12);
        await query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedPass, req.user!.id]);
        
        res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.post('/create-staff', protect as any, requireRole('superadmin') as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;
        if (!['admin', 'superadmin'].includes(role)) {
            res.status(400).json({ success: false, message: 'Invalid role.' }); return;
        }

        const existsRes = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existsRes.rows.length > 0) { res.status(409).json({ success: false, message: 'Email already registered.' }); return; }

        const id = uuidv4();
        const hashedPass = await bcrypt.hash(password, 12);
        
        await query(
            'INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
            [id, name, email, hashedPass, role]
        );

        res.status(201).json({ success: true, message: 'Staff account created.', user: { id, name, email, role } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

router.post('/verify-otp', async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, otp } = req.body;
        const userRes = await query('SELECT id FROM users WHERE email = $1 AND otp = $2 AND otp_expire > NOW()', [email, otp]);
        if (userRes.rows.length === 0) { res.status(400).json({ success: false, message: 'Invalid or expired OTP.' }); return; }
        
        await query('UPDATE users SET is_verified = true, otp = NULL, otp_expire = NULL, updated_at = NOW() WHERE id = $1', [userRes.rows[0].id]);
        res.json({ success: true, message: 'Email verified successfully.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
    try {
        const userRes = await query('SELECT id, name, email FROM users WHERE email = $1', [req.body.email]);
        if (userRes.rows.length === 0) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
        const user = userRes.rows[0];

        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await query('UPDATE users SET reset_password_token = $1, reset_password_expire = $2 WHERE id = $3', [hashedToken, expire, user.id]);

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, user.name, resetUrl);

        res.json({ success: true, message: 'Reset email sent.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.post('/reset-password/:token', async (req: Request, res: Response): Promise<void> => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token as string).digest('hex');
        const userRes = await query('SELECT id FROM users WHERE reset_password_token = $1 AND reset_password_expire > NOW()', [hashedToken]);
        if (userRes.rows.length === 0) { res.status(400).json({ success: false, message: 'Invalid or expired token.' }); return; }

        const hashedPass = await bcrypt.hash(req.body.password, 12);
        await query('UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expire = NULL, updated_at = NOW() WHERE id = $2', [hashedPass, userRes.rows[0].id]);

        res.json({ success: true, message: 'Password reset successful.' });
    } catch (err) { res.status(500).json({ success: false, message: 'Server error.' }); }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/callback/google', passport.authenticate('google', { session: false }), (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken(user.id, user.email, user.role);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
});

router.get('/microsoft', passport.authenticate('microsoft'));

router.get('/microsoft/callback', passport.authenticate('microsoft', { session: false }), (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken(user.id, user.email, user.role);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
});

export default router;
