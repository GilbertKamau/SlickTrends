import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.postgres';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            role: string;
            [key: string]: any;
        }
        interface Request {
            user?: User;
        }
    }
}

export type AuthRequest = Request;

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'Not authenticated. No token provided.' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; email: string; role: string };
        const userRes = await query('SELECT id, email, role, is_active FROM users WHERE id = $1', [decoded.id]);
        const user = userRes.rows[0];
        if (!user || !user.is_active) {
            res.status(401).json({ success: false, message: 'User not found or inactive.' });
            return;
        }
        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Access denied. Insufficient permissions.' });
            return;
        }
        next();
    };
};
