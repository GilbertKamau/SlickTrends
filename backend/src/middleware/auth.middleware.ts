import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

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
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            res.status(401).json({ success: false, message: 'User not found or inactive.' });
            return;
        }
        req.user = { id: user._id.toString(), email: user.email, role: user.role };
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
