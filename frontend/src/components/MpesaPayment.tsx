'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Smartphone, CheckCircle, Loader2, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MpesaPayProps {
    orderId: string;
    amount: number;
    onSuccess?: () => void;
}

type PayStatus = 'idle' | 'sending' | 'polling' | 'success' | 'failed' | 'cancelled' | 'timeout';

const MAX_POLLS = 12;       // 12 × 5s = 60 seconds max
const POLL_INTERVAL = 5000; // 5 seconds

export default function MpesaPayment({ orderId, amount, onSuccess }: MpesaPayProps) {
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState<PayStatus>('idle');
    const [checkoutId, setCheckoutId] = useState('');
    const [error, setError] = useState('');
    const [pollCount, setPollCount] = useState(0);
    const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        };
    }, []);

    const normalizePhone = (raw: string): string => {
        const digits = raw.replace(/\D/g, '');
        if (digits.startsWith('0') && digits.length === 10) return `254${digits.slice(1)}`;
        if (digits.startsWith('254') && digits.length === 12) return digits;
        if (digits.startsWith('7') && digits.length === 9) return `254${digits}`;
        return digits;
    };

    const validatePhone = (raw: string): boolean => {
        const normalized = normalizePhone(raw);
        return /^2547\d{8}$/.test(normalized) || /^2541\d{8}$/.test(normalized);
    };

    // ─── Poll for payment status ─────────────────────────────────────
    const pollPaymentStatus = useCallback(async (cId: string, attempt: number) => {
        if (!isMountedRef.current || attempt >= MAX_POLLS) {
            if (isMountedRef.current) {
                setStatus('timeout');
                setError('Payment verification timed out. If you completed the payment, it will be confirmed shortly.');
            }
            return;
        }

        try {
            const res = await api.post('/payments/mpesa/query', { checkoutRequestId: cId });
            const { status: payStatus } = res.data;

            if (!isMountedRef.current) return;

            if (payStatus === 'completed') {
                setStatus('success');
                toast.success('M-Pesa payment confirmed! 🎉');
                onSuccess?.();
                return;
            } else if (payStatus === 'cancelled') {
                setStatus('cancelled');
                setError('You cancelled the M-Pesa payment. Tap "Resend" to try again.');
                return;
            } else if (payStatus === 'failed') {
                setStatus('failed');
                setError(res.data.message || 'Payment failed. Please try again.');
                return;
            }
            // Still pending — schedule next poll
            setPollCount(attempt + 1);
            pollTimerRef.current = setTimeout(() => pollPaymentStatus(cId, attempt + 1), POLL_INTERVAL);
        } catch {
            // Network error during poll — keep trying
            if (isMountedRef.current && attempt < MAX_POLLS) {
                pollTimerRef.current = setTimeout(() => pollPaymentStatus(cId, attempt + 1), POLL_INTERVAL);
            }
        }
    }, [onSuccess]);

    const handleStkPush = async () => {
        if (!phone) { setError('Please enter your M-Pesa phone number.'); return; }
        if (!validatePhone(phone)) { setError('Enter a valid Safaricom number e.g. 07XX XXX XXX'); return; }
        setError('');
        setStatus('sending');
        setPollCount(0);

        try {
            const normalized = normalizePhone(phone);
            const res = await api.post('/payments/mpesa/stkpush', {
                phone: normalized,
                amount,
                orderId,
            });
            const cId = res.data.checkoutRequestId;
            setCheckoutId(cId);
            setStatus('polling');
            toast.success('STK Push sent! Check your phone.');

            // Start polling after a short delay (give user time to see the prompt)
            pollTimerRef.current = setTimeout(() => pollPaymentStatus(cId, 0), 3000);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send STK push';
            setError(msg);
            setStatus('failed');
        }
    };

    const handleRetry = () => {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        setStatus('idle');
        setError('');
        setCheckoutId('');
        setPollCount(0);
    };

    const isSending = status === 'sending';
    const isIdleOrRetryable = status === 'idle' || status === 'failed' || status === 'cancelled' || status === 'timeout';

    const progressPercent = status === 'polling' ? Math.min((pollCount / MAX_POLLS) * 100, 100) : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', borderRadius: 14, border: '1px solid rgba(16,185,129,0.25)' }}>
                <div style={{ width: 50, height: 50, borderRadius: 12, background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Smartphone size={24} color="#fff" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#f5f0ff' }}>M-Pesa Mobile Payment</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b9a8a', marginTop: 2 }}>Powered by Safaricom Daraja API</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>KES {amount.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b5a8a' }}>Amount due</div>
                </div>
            </div>

            {/* Status: idle → phone input */}
            {isIdleOrRetryable && (
                <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#b8a9d0', marginBottom: 10 }}>
                        Safaricom Phone Number
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a', fontSize: '0.9rem', fontWeight: 600 }}>🇰🇪 +254</div>
                            <input
                                type="tel"
                                placeholder="712 345 678"
                                value={phone}
                                onChange={e => { setPhone(e.target.value); setError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleStkPush()}
                                style={{
                                    width: '100%', padding: '13px 14px 13px 80px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: `1.5px solid ${error ? '#ef4444' : 'rgba(124,58,237,0.3)'}`,
                                    borderRadius: 12, color: '#f5f0ff', fontSize: '1rem',
                                    outline: 'none', fontFamily: 'Inter, sans-serif',
                                    transition: 'border-color 0.2s',
                                }}
                            />
                        </div>
                        <button
                            onClick={handleStkPush}
                            disabled={isSending}
                            style={{
                                padding: '13px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
                                background: 'linear-gradient(135deg, #059669, #10b981)',
                                color: '#fff', fontWeight: 700, fontSize: '0.9rem',
                                display: 'flex', alignItems: 'center', gap: 8,
                                transition: 'all 0.2s', whiteSpace: 'nowrap',
                            }}
                        >
                            {isSending ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Smartphone size={16} />}
                            {isSending ? 'Sending…' : 'Send STK Push'}
                        </button>
                    </div>

                    {error && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, color: '#ef4444', fontSize: '0.85rem' }}>
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    {/* How it works */}
                    <div style={{ marginTop: 18, padding: 16, background: 'rgba(16,185,129,0.07)', borderRadius: 10, border: '1px solid rgba(16,185,129,0.15)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', marginBottom: 10 }}>How M-Pesa STK Push works:</div>
                        {[
                            'Enter your Safaricom number and tap "Send STK Push"',
                            'A pop-up prompt will appear on your phone',
                            'Enter your M-Pesa PIN to confirm payment',
                            'Payment will be confirmed automatically',
                        ].map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: '0.8rem', color: '#b8a9d0' }}>
                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>{i + 1}</span>
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status: polling — waiting for user PIN + auto-checking */}
            {status === 'polling' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Loader2 size={32} color="#10b981" style={{ animation: 'spin 1.2s linear infinite' }} />
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: 10 }}>
                        Check Your Phone!
                    </h3>
                    <p style={{ color: '#b8a9d0', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 16px' }}>
                        An M-Pesa STK Push prompt has been sent to <strong style={{ color: '#10b981' }}>{phone}</strong>. Enter your PIN to confirm payment of <strong style={{ color: '#d4af37' }}>KES {amount.toLocaleString()}</strong>.
                    </p>

                    {/* Progress bar */}
                    <div style={{ maxWidth: 280, margin: '0 auto 16px', height: 6, background: 'rgba(124,58,237,0.15)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #10b981, #059669)',
                            borderRadius: 3,
                            width: `${progressPercent}%`,
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b5a8a', marginBottom: 20 }}>
                        Verifying payment... ({Math.ceil((MAX_POLLS - pollCount) * POLL_INTERVAL / 1000)}s remaining)
                    </div>

                    {checkoutId && (
                        <div style={{ fontSize: '0.75rem', color: '#6b5a8a', marginBottom: 20, fontFamily: 'monospace' }}>
                            Checkout ID: {checkoutId.slice(0, 16)}…
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button onClick={handleRetry} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: '#b8a9d0', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <RefreshCw size={14} /> Resend
                        </button>
                    </div>
                </div>
            )}

            {/* Status: cancelled by user */}
            {status === 'cancelled' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(251,146,60,0.15)', border: '2px solid #fb923c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <XCircle size={36} color="#fb923c" />
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: 8, color: '#fb923c' }}>Payment Cancelled</h3>
                    <p style={{ color: '#b8a9d0', fontSize: '0.875rem', marginBottom: 20 }}>You cancelled the M-Pesa prompt. No charge was made.</p>
                    <button onClick={handleRetry} className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.875rem' }}>
                        <RefreshCw size={15} style={{ marginRight: 8 }} /> Try Again
                    </button>
                </div>
            )}

            {/* Status: timeout */}
            {status === 'timeout' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(251,146,60,0.15)', border: '2px solid #fb923c', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <AlertCircle size={36} color="#fb923c" />
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: 8, color: '#fb923c' }}>Verification Timed Out</h3>
                    <p style={{ color: '#b8a9d0', fontSize: '0.875rem', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 20px' }}>
                        If you completed the payment on your phone, your order will be confirmed automatically once M-Pesa processes it.
                    </p>
                    <button onClick={handleRetry} className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.875rem' }}>
                        <RefreshCw size={15} style={{ marginRight: 8 }} /> Resend STK Push
                    </button>
                </div>
            )}

            {/* Status: success */}
            {status === 'success' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(16,185,129,0.1))', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <CheckCircle size={36} color="#10b981" />
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: 8, color: '#10b981' }}>Payment Confirmed!</h3>
                    <p style={{ color: '#b8a9d0', fontSize: '0.875rem' }}>Your M-Pesa payment of KES {amount.toLocaleString()} has been received.</p>
                </div>
            )}
        </div>
    );
}
