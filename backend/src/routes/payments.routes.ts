import { Router, Request, Response } from 'express';
import axios from 'axios';
import { query } from '../config/db.postgres';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { triggerOrderConfirmedEmail } from '../services/order-email.service';
import { getRedis } from '../config/redis';


const router = Router();

// ─── M-Pesa Helpers ─────────────────────────────────────────────────────────

/** Daraja base URL — switches between sandbox and production */
const getMpesaBaseUrl = (): string =>
    process.env.MPESA_ENV === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

/** Get M-Pesa OAuth access token */
const getMpesaToken = async (): Promise<string> => {
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const res = await axios.get(`${getMpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: { Authorization: `Basic ${auth}` },
    });
    return res.data.access_token;
};

/**
 * Store CheckoutRequestID → order mapping in Redis (or in-memory fallback).
 * The Daraja STK callback does NOT include AccountReference, so we must
 * persist this mapping when we send the STK push and look it up in the callback.
 */
const MPESA_KEY_PREFIX = 'mpesa:stk:';
const MPESA_TTL = 600; // 10 minutes — STK push expires after ~1 min, but give buffer

// In-memory fallback if Redis is unavailable
const stkMemoryStore = new Map<string, { orderId: string; userId: string; amount: number }>();

async function storeStkMapping(checkoutRequestId: string, data: { orderId: string; userId: string; amount: number }) {
    const redis = getRedis();
    if (redis) {
        await redis.setEx(`${MPESA_KEY_PREFIX}${checkoutRequestId}`, MPESA_TTL, JSON.stringify(data));
    } else {
        stkMemoryStore.set(checkoutRequestId, data);
        // Auto-cleanup after TTL
        setTimeout(() => stkMemoryStore.delete(checkoutRequestId), MPESA_TTL * 1000);
    }
}

async function getStkMapping(checkoutRequestId: string): Promise<{ orderId: string; userId: string; amount: number } | null> {
    const redis = getRedis();
    if (redis) {
        const raw = await redis.get(`${MPESA_KEY_PREFIX}${checkoutRequestId}`);
        return raw ? JSON.parse(raw) : null;
    }
    return stkMemoryStore.get(checkoutRequestId) || null;
}

async function deleteStkMapping(checkoutRequestId: string) {
    const redis = getRedis();
    if (redis) {
        await redis.del(`${MPESA_KEY_PREFIX}${checkoutRequestId}`);
    } else {
        stkMemoryStore.delete(checkoutRequestId);
    }
}


// ─── PAYPAL ─────────────────────────────────────────────────────────────────
const getPaypalToken = async (): Promise<string> => {
    const base = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const res = await axios.post(`${base}/v1/oauth2/token`, 'grant_type=client_credentials', {
        auth: { username: process.env.PAYPAL_CLIENT_ID as string, password: process.env.PAYPAL_CLIENT_SECRET as string },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data.access_token;
};

router.post('/paypal/create-order', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
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

router.post('/paypal/capture', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
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
        
        // Trigger confirmation email
        triggerOrderConfirmedEmail(orderId).catch(err => console.error('Order email failure (PayPal):', err));

        res.json({ success: true, capture });

    } catch (err) {
        res.status(500).json({ success: false, message: 'PayPal capture error.', error: err });
    }
});

// ─── MPESA STK PUSH ─────────────────────────────────────────────────────────
router.post('/mpesa/stkpush', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { phone, amount, orderId } = req.body;
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');
        const response = await axios.post(`${getMpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
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

        const checkoutRequestId = response.data.CheckoutRequestID;

        // ── Store the mapping so the callback can find the orderId ──
        await storeStkMapping(checkoutRequestId, {
            orderId,
            userId: req.user!.id,
            amount: Math.ceil(amount),
        });

        console.log(`[M-Pesa] STK Push sent → CheckoutRequestID: ${checkoutRequestId}, Order: ${orderId}`);

        res.json({
            success: true,
            checkoutRequestId,
            merchantRequestId: response.data.MerchantRequestID,
        });
    } catch (err: any) {
        console.error('[M-Pesa] STK Push error:', err?.response?.data || err.message);
        res.status(500).json({ success: false, message: 'MPesa STK Push error.', error: err?.response?.data || err.message });
    }
});

// ─── MPESA CALLBACK (from Safaricom servers) ────────────────────────────────
router.post('/mpesa/callback', async (req: Request, res: Response): Promise<void> => {
    try {
        const { Body: { stkCallback } } = req.body;
        const checkoutRequestId = stkCallback.CheckoutRequestID;

        console.log(`[M-Pesa Callback] Received for CheckoutRequestID: ${checkoutRequestId}, ResultCode: ${stkCallback.ResultCode}`);

        if (stkCallback.ResultCode === 0) {
            // ── Look up orderId from our stored mapping ──
            const mapping = await getStkMapping(checkoutRequestId);
            if (!mapping) {
                console.warn(`[M-Pesa Callback] No mapping found for CheckoutRequestID: ${checkoutRequestId}`);
                res.json({ ResultCode: 0, ResultDesc: 'Accepted (no mapping)' });
                return;
            }

            const { orderId, userId } = mapping;

            // ── Idempotency: check if transaction already recorded ──
            const existing = await query(
                `SELECT id FROM transactions WHERE order_id = $1 AND payment_method = 'mpesa' AND status = 'completed'`,
                [orderId]
            );
            if (existing.rows.length > 0) {
                console.log(`[M-Pesa Callback] Duplicate callback for order ${orderId}, skipping.`);
                res.json({ ResultCode: 0, ResultDesc: 'Already processed' });
                return;
            }

            // ── Extract payment metadata from callback ──
            const meta = stkCallback.CallbackMetadata.Item;
            const amount = meta.find((i: { Name: string }) => i.Name === 'Amount')?.Value;
            const receipt = meta.find((i: { Name: string }) => i.Name === 'MpesaReceiptNumber')?.Value;
            const phone = meta.find((i: { Name: string }) => i.Name === 'PhoneNumber')?.Value;

            // ── Record the transaction ──
            await query(
                `INSERT INTO transactions (order_id, user_id, amount, currency, payment_method, payment_provider_id, status, metadata)
           VALUES ($1, $2, $3, 'KES', 'mpesa', $4, 'completed', $5)`,
                [orderId, userId, amount, receipt, JSON.stringify({ phone, receipt, amount, checkoutRequestId })]
            );
            await query(`UPDATE orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`, [orderId]);

            console.log(`[M-Pesa Callback] ✅ Payment confirmed — Order: ${orderId}, Receipt: ${receipt}, Amount: KES ${amount}`);

            // Trigger confirmation email
            triggerOrderConfirmedEmail(orderId).catch(err => console.error('Order email failure (MPesa):', err));

            // Clean up the mapping
            await deleteStkMapping(checkoutRequestId);
        } else {
            console.warn(`[M-Pesa Callback] Payment failed — ResultCode: ${stkCallback.ResultCode}, Desc: ${stkCallback.ResultDesc}`);
        }

        res.json({ ResultCode: 0, ResultDesc: 'Success' });
    } catch (err) {
        console.error('[M-Pesa Callback] Error processing callback:', err);
        res.status(500).json({ ResultCode: 1, ResultDesc: 'Error' });
    }
});

// ─── MPESA STK QUERY (poll payment status from frontend) ────────────────────
router.post('/mpesa/query', protect as any, async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { checkoutRequestId } = req.body;
        if (!checkoutRequestId) {
            res.status(400).json({ success: false, message: 'checkoutRequestId is required.' });
            return;
        }

        // First check if we already have a completed transaction (callback already fired)
        const mapping = await getStkMapping(checkoutRequestId);
        if (mapping) {
            const txRes = await query(
                `SELECT id, status FROM transactions WHERE order_id = $1 AND payment_method = 'mpesa' AND status = 'completed'`,
                [mapping.orderId]
            );
            if (txRes.rows.length > 0) {
                res.json({ success: true, status: 'completed', orderId: mapping.orderId });
                return;
            }
        }

        // If no completed transaction yet, query Daraja for status
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

        const response = await axios.post(`${getMpesaBaseUrl()}/mpesa/stkpushquery/v1/query`, {
            BusinessShortCode: process.env.MPESA_SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId,
        }, { headers: { Authorization: `Bearer ${token}` } });

        const resultCode = response.data.ResultCode;

        if (resultCode === '0' || resultCode === 0) {
            // Payment successful — callback might not have arrived yet
            res.json({ success: true, status: 'completed', orderId: mapping?.orderId });
        } else if (resultCode === '1032' || resultCode === 1032) {
            // User cancelled
            res.json({ success: true, status: 'cancelled', message: 'Transaction was cancelled by user.' });
        } else if (resultCode === '1037' || resultCode === 1037 || resultCode === '1' || resultCode === 1) {
            // Timeout / pending
            res.json({ success: true, status: 'pending', message: 'Waiting for user to enter PIN.' });
        } else {
            res.json({ success: true, status: 'failed', resultCode, message: response.data.ResultDesc });
        }
    } catch (err: any) {
        // Daraja returns a 500 if the request is still being processed
        const errMsg = err?.response?.data?.errorMessage || err.message;
        if (errMsg?.includes('being processed') || err?.response?.status === 500) {
            res.json({ success: true, status: 'pending', message: 'Payment is still being processed.' });
        } else {
            console.error('[M-Pesa Query] Error:', errMsg);
            res.status(500).json({ success: false, message: 'STK query error.', error: errMsg });
        }
    }
});


export default router;
