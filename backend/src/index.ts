import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
// import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { configurePassport } from './config/passport';

import connectMongoDB from './config/db.mongo';
import { getRedis, initRedis } from './config/redis';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/products.routes';
import orderRoutes from './routes/orders.routes';
import paymentRoutes from './routes/payments.routes';
import superadminRoutes from './routes/superadmin.routes';
import promotionRoutes from './routes/promotions.routes';
import n8nRoutes from './routes/n8n.routes';
import uploadRoutes from './routes/upload.routes';
import { initProductCleanupJob } from './jobs/productCleanup';

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security & Rate Limiting ────────────────────────────────────────────────
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 200, // Limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' },
    skip: (req) => req.url.startsWith('/api/payments/stripe/webhook'), // Don't block webhooks
});

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet()); // Set security HTTP headers
app.use(morgan('dev')); // Logging
app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? true : (process.env.FRONTEND_URL || 'http://localhost:3000'),
    credentials: true,
}));

// Apply global rate limiter
app.use('/api', globalLimiter);

// Sanitize data against NoSQL Query Injection
// app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Stripe webhook needs raw body
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
configurePassport();
app.use(passport.initialize());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/n8n', n8nRoutes);
app.use('/api/upload', uploadRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_, res) => {
    const redis = getRedis();
    res.json({
        status: 'OK', service: 'Slick Trends API',
        timestamp: new Date().toISOString(),
        redis: redis ? 'connected' : 'disabled',
    });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errorMsg = `[500 ERROR] ${req.method} ${req.url} - ${err.message}`;
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log(errorMsg);
    console.log(err.stack);
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    
    // Also log to file
    const errorLog = `[${new Date().toISOString()}] GLOBAL ERROR: ${err.message}\n${err.stack}\n\n`;
    require('fs').appendFileSync('error.log', errorLog);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const start = async () => {
    await connectMongoDB();
    // Connect Redis before proceeding
    await initRedis();
    app.listen(PORT, () => {
        console.log(`\n🚀 Slick Trends API running on http://localhost:${PORT}`);
        console.log(`📦 MongoDB Atlas: connected`);
        console.log(`🗄️  PostgreSQL Cloud: connected`);
        console.log(`📧 Email: SMTP via ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
        console.log(`🔴 Redis: ${process.env.REDIS_URL ? 'configured' : 'local fallback'}\n`);
        
        // Initialize jobs
        initProductCleanupJob();
    });
};

start();

export default app;

