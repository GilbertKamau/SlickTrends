'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [show, setShow] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(form.email, form.password);
            toast.success('Welcome back!');
            const user = useAuthStore.getState().user;
            if (user?.role === 'superadmin') router.push('/superadmin');
            else if (user?.role === 'admin') router.push('/admin');
            else router.push('/');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
            toast.error(msg);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0d060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={22} fill="#0a0012" color="#0a0012" />
                        </div>
                    </Link>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>
                        Welcome to <span className="gradient-text">Slick Trends</span>
                    </h1>
                    <p style={{ color: '#6b5a8a', marginTop: 8, fontSize: '0.9rem' }}>Sign in to your account</p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <label className="input-label">Email</label>
                            <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input-field" type={show ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b5a8a', cursor: 'pointer' }}>
                                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -10 }}>
                            <Link href="/auth/forgot-password" style={{ color: '#6b5a8a', fontSize: '0.8rem', textDecoration: 'none' }}>Forgot Password?</Link>
                        </div>
                        <button className="btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: isLoading ? 0.7 : 1 }}>
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0' }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(124,58,237,0.2)' }} />
                        <span style={{ color: '#6b5a8a', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Or continue with</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(124,58,237,0.2)' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <button onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/google`}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f0ff', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem' }}>
                            Google
                        </button>
                        <button onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/microsoft`}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f5f0ff', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.875rem' }}>
                            Microsoft
                        </button>
                    </div>

                    <div style={{ height: 1, background: 'rgba(124,58,237,0.1)', margin: '24px 0' }} />
                    <p style={{ textAlign: 'center', color: '#6b5a8a', fontSize: '0.875rem' }}>
                        No account?{' '}
                        <Link href="/auth/register" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600 }}>Create one free</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
