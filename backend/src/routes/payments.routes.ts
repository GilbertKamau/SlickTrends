import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import axios from 'axios';
import { query } from '../config/db.postgres';
import { protect, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-01-27.acacia' });

// ─── Helper: Get MPesa Access Token ─────────────────────────────────────────
const getMpesaToken = async (): Promise<string> => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const baseUrl = process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';
    const res = await axios.get(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` },
    });
    return res.data.access_token;
};

// ─── STRIPE ─────────────────────────────────────────────────────────────────
router.post('/stripe/create-intent', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId, amount, currency = 'kes' } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            metadata: { orderId, userId: req.user!.id },
        });
        res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Stripe error.', error: err });
    }
});

router.post('/stripe/webhook', async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;
    try {
        const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
        if (event.type === 'payment_intent.succeeded') {
            const pi = event.data.object as Stripe.PaymentIntent;
            const { orderId, userId } = pi.metadata;
            await query(
                `INSERT INTO transactions (order_id, user_id, amount, currency, payment_method, payment_provider_id, status, metadata)
         VALUES ($1, $2, $3, $4, 'stripe', $5, 'completed', $6)`,
                [orderId, userId, pi.amount / 100, pi.currency.toUpperCase(), pi.id, JSON.stringify(pi)]
            );
            await query(`UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [orderId]);
        }
        res.json({ received: true });
    } catch (err) {
        res.status(400).json({ error: 'Webhook error.' });
    }
});

// ─── PAYPAL ─────────────────────────────────────────────────────────────────
const getPaypalToken = async (): Promise<string> => {
    const base = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const res = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
        auth: { username: process.env.PAYPAL_CLIENT_ID as string, password: process.env.PAYPAL_CLIENT_SECRET as string },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data.access_token;
};

router.post('/paypal/create-order', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId, amount, currency = 'USD' } = req.body;
        const token = await getPaypalToken();
        const base = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
        const response = await axios.post(`${base}/v2/checkout/orders`, {
            intent: 'CAPTURE',
            purchase_units: [{ reference_id: orderId, amount: { currency_code: currency, value: amount.toFixed(2) } }],
        }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        res.json({ success: true, paypalOrderId: response.data.id });
    } catch (err) {
        res.status(500).json({ success: false, message: 'PayPal error.', error: err });
    }
});

router.post('/paypal/capture', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { paypalOrderId, orderId } = req.body;
        const token = await getPaypalToken();
        const base = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
        const response = await axios.post(`${base}/v2/checkout/orders/${paypalOrderId}/capture`, {}, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        const capture = response.data.purchase_units[0].payments.captures[0];
        await query(
            `INSERT INTO transactions (order_id, user_id, amount, currency, payment_method, payment_provider_id, status, metadata)
       VALUES ($1, $2, $3, $4, 'paypal', $5, 'completed', $6)`,
            [orderId, req.user!.id, parseFloat(capture.amount.value), capture.amount.currency_code, capture.id, JSON.stringify(response.data)]
        );
        await query(`UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [orderId]);
        res.json({ success: true, capture });
    } catch (err) {
        res.status(500).json({ success: false, message: 'PayPal capture error.', error: err });
    }
});

// ─── MPESA STK PUSH ─────────────────────────────────────────────────────────
router.post('/mpesa/stkpush', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, amount, orderId } = req.body;
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
        const baseUrl = process.env.MPESA_ENV === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';
        const response = await axios.post(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.ceil(amount),
            PartyA: phone.replace('+', ''),
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: phone.replace('+', ''),
            CallBackURL: process.env.MPESA_CALLBACK_URL,
            AccountReference: `SlickTrends-${orderId}`,
            TransactionDesc: 'Slick Trends Order Payment',
        }, { headers: { Authorization: `Bearer ${token}` } });
        res.json({ success: true, checkoutRequestId: response.data.CheckoutRequestID, merchantRequestId: response.data.MerchantRequestID });
    } catch (err) {
        res.status(500).json({ success: false, message: 'MPesa STK Push error.', error: err });
    }
});

router.post('/mpesa/callback', async (req: Request, res: Response): Promise<void> => {
    try {
        const { Body: { stkCallback } } = req.body;
        if (stkCallback.ResultCode === 0) {
            const meta = stkCallback.CallbackMetadata.Item;
            const amount = meta.find((i: { Name: string }) => i.Name === 'Amount')?.Value;
            const receipt = meta.find((i: { Name: string }) => i.Name === 'MpesaReceiptNumber')?.Value;
            const phone = meta.find((i: { Name: string }) => i.Name === 'PhoneNumber')?.Value;
            const accountRef = stkCallback.AccountReference || '';
            const orderId = accountRef.replace('SlickTrends-', '');
            if (orderId) {
                const orderRes = await query('SELECT user_id FROM orders WHERE id = $1', [orderId]);
                const userId = orderRes.rows[0]?.user_id || '';
                await query(
                    `INSERT INTO transactions (order_id, user_id, amount, currency, payment_method, payment_provider_id, status, metadata)
           VALUES ($1, $2, $3, 'KES', 'mpesa', $4, 'completed', $5)`,
                    [orderId, userId, amount, receipt, JSON.stringify({ phone, receipt, amount })]
                );
                await query(`UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [orderId]);
            }
        }
        res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (err) {
        res.status(500).json({ ResultCode: 1, ResultDesc: 'Error' });
    }
});

// ─── CARD (Visa/Mastercard via Stripe) ──────────────────────────────────────
router.post('/card/charge', protect, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { orderId, paymentMethodId, amount, currency = 'kes' } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            payment_method: paymentMethodId,
            confirm: true,
            automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
            metadata: { orderId, userId: req.user!.id, source: 'card' },
        });
        if (paymentIntent.status === 'succeeded') {
            await query(
                `INSERT INTO transactions (order_id, user_id, amount, currency, payment_method, payment_provider_id, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)`,
                [orderId, req.user!.id, amount, currency.toUpperCase(), paymentMethodId ? 'visa/mastercard' : 'card', paymentIntent.id, JSON.stringify(paymentIntent)]
            );
            await query(`UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [orderId]);
        }
        res.json({ success: true, status: paymentIntent.status });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Card payment error.', error: err });
    }
});

export default router;
