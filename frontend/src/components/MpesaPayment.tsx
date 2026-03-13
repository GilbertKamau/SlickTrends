'use client';
import { useState } from 'react';
import { Smartphone, CheckCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface MpesaPayProps {
    orderId: string;
    amount: number;
    onSuccess?: () => void;
}

type PayStatus = 'idle' | 'sending' | 'waiting' | 'success' | 'failed';

export default function MpesaPayment({ orderId, amount, onSuccess }: MpesaPayProps) {
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState<PayStatus>('idle');
    const [checkoutId, setCheckoutId] = useState('');
    const [error, setError] = useState('');

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

    const handleStkPush = async () => {
        if (!phone) { setError('Please enter your M-Pesa phone number.'); return; }
        if (!validatePhone(phone)) { setError('Enter a valid Safaricom number e.g. 07XX XXX XXX'); return; }
        setError('');
        setStatus('sending');
        try {
            const normalized = normalizePhone(phone);
            const res = await api.post('/payments/mpesa/stkpush', {
                phone: normalized,
                amount,
                orderId,
            });
            setCheckoutId(res.data.checkoutRequestId);
            setStatus('waiting');
            toast.success('STK Push sent! Check your phone.');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send STK push';
            setError(msg);
            setStatus('failed');
        }
    };

    const handleConfirmManually = () => {
        setStatus('success');
        toast.success('Payment marked as complete!');
        onSuccess?.();
    };

    const handleRetry = () => {
        setStatus('idle');
        setError('');
        setCheckoutId('');
    };

    const isSending = status === 'sending';
    const isIdleOrFailed = status === 'idle' || status === 'failed';

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
            {isIdleOrFailed && (
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
                            'You\'ll receive an SMS confirmation from M-Pesa',
                        ].map((step, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: '0.8rem', color: '#b8a9d0' }}>
                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>{i + 1}</span>
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status: waiting for user PIN */}
            {status === 'waiting' && (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <Loader2 size={32} color="#10b981" style={{ animation: 'spin 1.2s linear infinite' }} />
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: 10 }}>
                        Check Your Phone!
                    </h3>
                    <p style={{ color: '#b8a9d0', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 320, margin: '0 auto 24px' }}>
                        An M-Pesa STK Push prompt has been sent to <strong style={{ color: '#10b981' }}>{phone}</strong>. Enter your PIN to confirm payment of <strong style={{ color: '#d4af37' }}>KES {amount.toLocaleString()}</strong>.
                    </p>
                    {checkoutId && (
                        <div style={{ fontSize: '0.75rem', color: '#6b5a8a', marginBottom: 20, fontFamily: 'monospace' }}>
                            Checkout ID: {checkoutId.slice(0, 16)}…
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button onClick={handleConfirmManually} className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.875rem' }}>
                            <CheckCircle size={15} /> I've paid — Continue
                        </button>
                        <button onClick={handleRetry} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 10, color: '#b8a9d0', cursor: 'pointer', fontSize: '0.875rem' }}>
                            <RefreshCw size={14} /> Resend
                        </button>
                    </div>
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
