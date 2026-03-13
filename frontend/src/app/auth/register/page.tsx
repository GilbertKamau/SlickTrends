'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Star } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [show, setShow] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        try {
            await register(form);
            toast.success('Account created! Welcome to Slick Trends!');
            router.push('/');
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
            toast.error(msg);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)' }}>
            <div style={{ width: '100%', maxWidth: 420 }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0d060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={22} fill="#0a0012" color="#0a0012" />
                        </div>
                    </Link>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>
                        Join <span className="gradient-text">Slick Trends</span>
                    </h1>
                    <p style={{ color: '#6b5a8a', marginTop: 8, fontSize: '0.9rem' }}>Create your free account today</p>
                </div>

                <div className="glass-card" style={{ padding: 32 }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <label className="input-label">Full Name</label>
                            <input className="input-field" type="text" placeholder="Jane Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="input-label">Email</label>
                            <input className="input-field" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                        </div>
                        <div>
                            <label className="input-label">Phone (optional)</label>
                            <input className="input-field" type="tel" placeholder="+254 700 000000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                        </div>
                        <div>
                            <label className="input-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input className="input-field" type={show ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required style={{ paddingRight: 44 }} />
                                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b5a8a', cursor: 'pointer' }}>
                                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button className="btn-primary" type="submit" disabled={isLoading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '1rem', opacity: isLoading ? 0.7 : 1 }}>
                            {isLoading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>
                    <div style={{ height: 1, background: 'rgba(124,58,237,0.2)', margin: '24px 0' }} />
                    <p style={{ textAlign: 'center', color: '#6b5a8a', fontSize: '0.875rem' }}>
                        Already have an account?{' '}
                        <Link href="/auth/login" style={{ color: '#d4af37', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
