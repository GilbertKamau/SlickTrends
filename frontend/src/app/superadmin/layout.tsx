'use client';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Users, DollarSign, BarChart2, LogOut, Star, Megaphone } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';

function SuperAdminSidebar() {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();
    const nav = [
        { href: '/superadmin', label: 'Metrics', icon: TrendingUp },
        { href: '/superadmin/users', label: 'Users', icon: Users },
        { href: '/superadmin/transactions', label: 'Transactions', icon: DollarSign },
        { href: '/superadmin/promotions', label: 'Manage Ads', icon: Megaphone },
        { href: '/admin', label: 'Admin Panel', icon: BarChart2 },
    ];

    return (
        <aside className="admin-sidebar" style={{ width: 260, height: '100vh', position: 'fixed', left: 0, top: 0, background: '#0a0012', borderRight: '1px solid rgba(212,175,55,0.15)', padding: '24px 20px', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0d060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={16} fill="#0a0012" color="#0a0012" />
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700 }}>
                    <span className="gradient-text">Slick</span><span style={{ color: '#b8a9d0' }}> Super</span>
                </div>
            </div>
            
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {nav.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, textDecoration: 'none', color: '#b8a9d0', fontSize: '0.9rem', transition: 'all 0.2s', background: pathname === href ? 'rgba(212,175,55,0.1)' : 'transparent' }}>
                        <Icon size={18} color={pathname === href ? '#d4af37' : '#6b5a8a'} />
                        <span style={{ color: pathname === href ? '#f5f0ff' : '#b8a9d0' }}>{label}</span>
                    </Link>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(212,175,55,0.1)' }}>
                <div style={{ fontSize: '0.85rem', color: '#f5f0ff', fontWeight: 600, marginBottom: 4 }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#d4af37', marginBottom: 16 }}>⭐ Super Admin</div>
                <button onClick={() => { logout(); router.push('/auth/login'); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 8, color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </aside>
    );
}

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { user } = useAuthStore();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (!user || user.role !== 'superadmin') {
            router.push('/auth/login');
        } else {
            setAuthorized(true);
        }
    }, [user, router]);

    if (!authorized) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0012', color: '#f5f0ff' }}>
            <SuperAdminSidebar />
            <main style={{ flex: 1, marginLeft: 260, padding: '40px 48px' }}>
                {children}
            </main>
        </div>
    );
}
