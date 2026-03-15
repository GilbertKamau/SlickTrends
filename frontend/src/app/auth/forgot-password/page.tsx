'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Star } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
            toast.success('Reset email sent!');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to send reset email');
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
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>Reset Password</h1>
                    <p style={{ color: '#6b5a8a', marginTop: 8, fontSize: '0.9rem' }}>We'll send you a link to reset your account</p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    {!submitted ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="input-label">Email Address</label>
                                <div style={{ position: 'relative' }}>
                                    <input className="input-field" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ paddingLeft: 44 }} />
                                    <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a' }} />
                                </div>
                            </div>
                            <button className="btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: isLoading ? 0.7 : 1 }}>
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                                <Mail size={24} color="#10b981" />
                            </div>
                            <h3 style={{ color: '#f5f0ff', marginBottom: 12 }}>Check your email</h3>
                            <p style={{ color: '#b8a9d0', fontSize: '0.9rem', lineHeight: 1.6 }}>We've sent a password reset link to <br/><strong style={{ color: '#d4af37' }}>{email}</strong></p>
                        </div>
                    )}

                    <div style={{ marginTop: 24, textAlign: 'center' }}>
                        <Link href="/auth/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#d4af37', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
                            <ArrowLeft size={14} /> Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
