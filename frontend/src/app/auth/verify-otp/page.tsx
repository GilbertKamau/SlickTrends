'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Star } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function VerifyOtpPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!user) router.push('/auth/login');
    }, [user, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const value = e.target.value;
        if (!/^\d*$/.test(value)) return;
        
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        // Auto focus next
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const fullOtp = otp.join('');
        if (fullOtp.length < 6) return;

        setIsLoading(true);
        try {
            await api.post('/auth/verify-otp', { email: user?.email, otp: fullOtp });
            toast.success('Account verified!');
            router.push('/');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.1) 0%, transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0d060)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                        <Star size={22} fill="#0a0012" color="#0a0012" />
                    </div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>Verify Your Email</h1>
                    <p style={{ color: '#6b5a8a', marginTop: 8, fontSize: '0.9rem' }}>We sent a code to <strong style={{color: '#d4af37'}}>{user?.email}</strong></p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
                            {otp.map((digit, idx) => (
                                <input
                                    key={idx}
                                    id={`otp-${idx}`}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(e, idx)}
                                    onKeyDown={(e) => handleKeyDown(e, idx)}
                                    style={{
                                        width: 45, height: 55, textAlign: 'center', fontSize: '1.4rem', fontWeight: 800,
                                        background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.2)',
                                        borderRadius: 8, color: '#f5f0ff', outline: 'none', transition: 'all 0.2s'
                                    }}
                                    autoFocus={idx === 0}
                                />
                            ))}
                        </div>
                        <button className="btn-primary" type="submit" disabled={isLoading || otp.some(d => !d)} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: isLoading ? 0.7 : 1 }}>
                            <ShieldCheck size={18} style={{ marginRight: 8 }} /> {isLoading ? 'Verifying...' : 'Verify Account'}
                        </button>
                    </form>
                    
                    <p style={{ textAlign: 'center', color: '#6b5a8a', fontSize: '0.85rem', marginTop: 24 }}>
                        Didn't receive the code? <button onClick={() => toast('Code resent!')} style={{ background: 'none', border: 'none', color: '#d4af37', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Resend Code</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
