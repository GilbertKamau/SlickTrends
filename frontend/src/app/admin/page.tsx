'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ShoppingCart, PlusCircle, LogOut, Menu, X, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function AdminSidebar({ active, onClose }: { active: string; onClose?: () => void }) {
    const { user, logout } = useAuthStore();
    const router = useRouter();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: TrendingUp },
        { href: '/admin/stock', label: 'Manage Stock', icon: Package },
        { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
    ];
    return (
        <aside className="admin-sidebar">
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
                <span className="gradient-text">Slick</span><span style={{ color: '#b8a9d0' }}> Admin</span>
            </div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                {navItems.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 10, textDecoration: 'none', background: active === href ? 'rgba(212,175,55,0.15)' : 'transparent', color: active === href ? '#d4af37' : '#b8a9d0', fontSize: '0.9rem', fontWeight: active === href ? 600 : 400, transition: 'all 0.2s' }}>
                        <Icon size={17} /><span>{label}</span>
                    </Link>
                ))}
            </nav>
            <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid rgba(124,58,237,0.2)' }}>
                {hasMounted && (
                    <div style={{ fontSize: '0.8rem', color: '#6b5a8a', marginBottom: 12 }}>{user?.name}<br /><span style={{ color: '#a855f7' }}>● Admin</span></div>
                )}
                <button onClick={() => { logout(); router.push('/auth/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <LogOut size={14} /> Logout
                </button>
            </div>
        </aside>
    );
}

export default function AdminDashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [stats, setStats] = useState({ totalProducts: 0, pendingOrders: 0, dispatchedOrders: 0, recentOrders: [] as { id: string; user_name: string; total: number; status: string; created_at: string }[] });
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        try {
            const [prodRes, ordersRes] = await Promise.allSettled([
                api.get('/products/admin/all?limit=1'),
                api.get('/orders?limit=10'),
            ]);
            
            const prodData = prodRes.status === 'fulfilled' ? prodRes.value.data : { total: 0 };
            const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value.data : { orders: [], total: 0 };
            
            if (prodRes.status === 'rejected') console.error('Products fetch error:', prodRes.reason);
            if (ordersRes.status === 'rejected') console.error('Orders fetch error:', ordersRes.reason);

            setStats({
                totalProducts: prodData.total || 0,
                pendingOrders: (ordersData.orders || []).filter((o: any) => o.status === 'pending').length,
                dispatchedOrders: (ordersData.orders || []).filter((o: any) => o.status === 'dispatched').length,
                recentOrders: (ordersData.orders || []).slice(0, 5),
            });

            if (prodRes.status === 'rejected' || ordersRes.status === 'rejected') {
                toast.error('Some statistics could not be loaded');
            }
        } catch (err) {
            console.error('Stats fetch error:', err);
            toast.error('Failed to load dashboard statistics');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) { router.push('/auth/login'); return; }
        fetchStats();
    }, [user, router, fetchStats]);

    const statusColor: Record<string, string> = { pending: '#fb923c', confirmed: '#60a5fa', dispatched: '#a78bfa', delivered: '#10b981', closed: '#6b5a8a', cancelled: '#ef4444' };

    return (
        <div className="admin-layout">
            <AdminSidebar active="/admin" />
            <main className="admin-main">
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>Dashboard</h1>
                    <p style={{ color: '#6b5a8a', marginTop: 4 }}>Welcome back, {user?.name}</p>
                </div>

                {loading ? <div className="spinner" /> : (
                    <>
                        {/* KPI Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20, marginBottom: 40 }}>
                            {[
                                { label: 'Total Products', value: stats.totalProducts, icon: Package, color: '#7c3aed' },
                                { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: '#d4af37' },
                                { label: 'Dispatched', value: stats.dispatchedOrders, icon: ShoppingCart, color: '#10b981' },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="glass-card" style={{ padding: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b5a8a', marginBottom: 8 }}>{label}</div>
                                            <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}</div>
                                        </div>
                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Icon size={20} color={color} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quick Actions */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
                            <Link href="/admin/stock" className="btn-primary" style={{ textDecoration: 'none' }}><PlusCircle size={16} /> Add Product</Link>
                            <Link href="/admin/orders" className="btn-secondary" style={{ textDecoration: 'none' }}>View All Orders</Link>
                        </div>

                        {/* Recent Orders */}
                        <div className="glass-card" style={{ padding: 24 }}>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                Recent Orders <Link href="/admin/orders" style={{ fontSize: '0.8rem', color: '#d4af37', textDecoration: 'none' }}>View all →</Link>
                            </h2>
                            {stats.recentOrders.length === 0 ? (
                                <p style={{ color: '#6b5a8a', textAlign: 'center', padding: '20px 0' }}>No orders yet</p>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
                                                {['Order ID', 'Customer', 'Total', 'Status', 'Date'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#6b5a8a', fontWeight: 500 }}>{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.recentOrders.map((o) => (
                                                <tr key={o.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                                                    <td style={{ padding: '12px 12px', color: '#b8a9d0', fontFamily: 'monospace', fontSize: '0.75rem' }}>{o.id.slice(0, 8)}...</td>
                                                    <td style={{ padding: '12px 12px', color: '#f5f0ff' }}>{o.user_name}</td>
                                                    <td style={{ padding: '12px 12px', color: '#d4af37', fontWeight: 600 }}>KES {Number(o.total).toLocaleString()}</td>
                                                    <td style={{ padding: '12px 12px' }}><span style={{ color: statusColor[o.status] || '#b8a9d0', fontWeight: 600, textTransform: 'capitalize' }}>{o.status}</span></td>
                                                    <td style={{ padding: '12px 12px', color: '#6b5a8a' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

export { AdminSidebar };
