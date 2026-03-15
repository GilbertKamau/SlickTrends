'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Star } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
    const router = useRouter();
    const { token } = useParams();
    const [form, setForm] = useState({ password: '', confirm: '' });
    const [show, setShow] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password !== form.confirm) {
            toast.error('Passwords do not match');
            return;
        }
        setIsLoading(true);
        try {
            await api.post(`/auth/reset-password/${token}`, { password: form.password });
            toast.success('Password updated successfully!');
            router.push('/auth/login');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Reset failed. Token may be invalid or expired.');
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
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>New Password</h1>
                    <p style={{ color: '#6b5a8a', marginTop: 8, fontSize: '0.9rem' }}>Enter a strong password to secure your account</p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <label className="input-label">New Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input-field" type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required style={{ paddingLeft: 44, paddingRight: 44 }} />
                                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a' }} />
                                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b5a8a', cursor: 'pointer' }}>
                                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Confirm Password</label>
                            <input className="input-field" type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
                        </div>
                        <button className="btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: isLoading ? 0.7 : 1 }}>
                            {isLoading ? 'Updating...' : 'Set New Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
