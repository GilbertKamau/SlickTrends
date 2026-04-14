'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, AlertTriangle, BarChart2, LogOut } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const PIE_COLORS = ['#d4af37', '#7c3aed', '#10b981', '#60a5fa', '#fb923c'];


export default function SuperAdminPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [metrics, setMetrics] = useState<{
        orders: { total: number; pending: number; dispatched: number; completed: number; cancelled: number };
        revenue: { total: number; today: number; monthly: { month: string; revenue: string }[] };
        payments: { byMethod: { payment_method: string; count: string; total: string }[] };
        products: { total: number; lowStock: number; byCategory: { id: string; count: number; avgPrice: number }[] };
        users: { customers: number };
    } | null>(null);
    const [trend, setTrend] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (!user || user.role !== 'superadmin') { router.push('/auth/login'); } }, [user, router]);

    const fetchAll = useCallback(async () => {
        try {
            const [mRes, tRes] = await Promise.all([
                api.get('/superadmin/metrics'),
                api.get('/superadmin/sales-trend?days=30'),
            ]);
            setMetrics(mRes.data.metrics);
            setTrend(tRes.data.trend || []);
        } catch { /* silent */ } finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchAll(); }, [fetchAll]);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div className="spinner" /></div>;

    const kpis = [
        { label: 'Total Revenue', value: `KES ${Number(metrics?.revenue?.total || 0).toLocaleString()}`, icon: DollarSign, color: '#d4af37', sub: `Today: KES ${Number(metrics?.revenue?.today || 0).toLocaleString()}` },
        { label: 'Total Orders', value: metrics?.orders?.total || 0, icon: ShoppingCart, color: '#7c3aed', sub: `${metrics?.orders?.pending || 0} pending` },
        { label: 'Products', value: metrics?.products?.total || 0, icon: Package, color: '#10b981', sub: `${metrics?.products?.lowStock || 0} low stock` },
        { label: 'Customers', value: metrics?.users?.customers || 0, icon: Users, color: '#60a5fa', sub: 'Registered users' },
    ];

    const orderPieData = [
        { name: 'Pending', value: metrics?.orders?.pending || 0 },
        { name: 'Dispatched', value: metrics?.orders?.dispatched || 0 },
        { name: 'Completed', value: metrics?.orders?.completed || 0 },
        { name: 'Cancelled', value: metrics?.orders?.cancelled || 0 },
    ].filter(d => d.value > 0);

    const paymentData = (metrics?.payments?.byMethod || []).map(p => ({
        method: p.payment_method,
        count: Number(p.count),
        total: Number(p.total),
    }));

    const categoryData = (metrics?.products?.byCategory || []).map(c => ({
        name: c.id.replace('-', ' '),
        count: c.count,
        avgPrice: Math.round(c.avgPrice),
    }));

    const monthlyData = (metrics?.revenue?.monthly || []).slice(0, 6).reverse().map(m => ({
        month: m.month.slice(5),
        revenue: parseFloat(m.revenue),
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ background: 'rgba(17,0,35,0.95)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem' }}>
                    <p style={{ color: '#6b5a8a', marginBottom: 4 }}>{label}</p>
                    <p style={{ color: '#d4af37', fontWeight: 700 }}>KES {payload[0].value.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>
                    <span className="gradient-text">Analytics</span> & Metrics
                </h1>
                <p style={{ color: '#6b5a8a', marginTop: 4 }}>Full platform overview — Super Admin</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 36 }}>
                {kpis.map(({ label, value, icon: Icon, color, sub }) => (
                    <div key={label} className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div style={{ fontSize: '0.8rem', color: '#6b5a8a' }}>{label}</div>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={18} color={color} />
                            </div>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color, marginBottom: 6, lineHeight: 1 }}>{value}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b5a8a' }}>{sub}</div>
                    </div>
                ))}
            </div>

            {/* Low Stock Alert */}
            {(metrics?.products?.lowStock || 0) > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.3)', borderRadius: 12, marginBottom: 32 }}>
                    <AlertTriangle size={18} color="#fb923c" />
                    <span style={{ color: '#fb923c', fontWeight: 600 }}>{metrics?.products?.lowStock} products</span>
                    <span style={{ color: '#b8a9d0', fontSize: '0.875rem' }}>are running low on stock (≤5 units)</span>
                    <Link href="/admin/stock" style={{ marginLeft: 'auto', color: '#fb923c', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>Manage Stock →</Link>
                </div>
            )}

            {/* Charts Row 1: Sales Trend + Order Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: 24 }}>Revenue Trend (Last 30 Days)</h3>
                    {trend.length === 0 ? (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a8a' }}>No transaction data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={trend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" />
                                <XAxis dataKey="date" tick={{ fill: '#6b5a8a', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                                <YAxis tick={{ fill: '#6b5a8a', fontSize: 11 }} />
                                <Tooltip content={CustomTooltip} />
                                <Line type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2.5} dot={{ fill: '#d4af37', r: 3 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: 24 }}>Order Status</h3>
                    {orderPieData.length === 0 ? (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a8a' }}>No orders yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={orderPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                                    {orderPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => [`${v} orders`, '']} contentStyle={{ background: 'rgba(17,0,35,0.95)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10 }} />
                                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8rem', color: '#b8a9d0' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Charts Row 2: Monthly Revenue + Payment Methods */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: 24 }}>Monthly Revenue</h3>
                    {monthlyData.length === 0 ? (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a8a' }}>No monthly data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" />
                                <XAxis dataKey="month" tick={{ fill: '#6b5a8a', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#6b5a8a', fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: 'rgba(17,0,35,0.95)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 10, color: '#f5f0ff' }} />
                                <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="glass-card" style={{ padding: 24 }}>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: 24 }}>Payments by Method</h3>
                    {paymentData.length === 0 ? (
                        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b5a8a' }}>No payment data yet</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
                            {paymentData.map((p, i) => (
                                <div key={p.method}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.875rem', color: '#b8a9d0', textTransform: 'capitalize' }}>{p.method}</span>
                                        <span style={{ fontSize: '0.875rem', color: PIE_COLORS[i], fontWeight: 600 }}>KES {p.total.toLocaleString()}</span>
                                    </div>
                                    <div style={{ height: 6, background: 'rgba(124,58,237,0.15)', borderRadius: 3 }}>
                                        <div style={{ height: '100%', background: PIE_COLORS[i], borderRadius: 3, width: `${Math.min((p.total / (paymentData[0]?.total || 1)) * 100, 100)}%`, transition: 'width 0.8s ease' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: 20 }}>Products by Category</h3>
                {categoryData.length === 0 ? (
                    <p style={{ color: '#6b5a8a', textAlign: 'center', padding: '20px 0' }}>No product data yet</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                        {categoryData.map((c, i) => (
                            <div key={c.name} style={{ padding: 16, background: 'rgba(124,58,237,0.1)', borderRadius: 12, border: '1px solid rgba(124,58,237,0.2)' }}>
                                <div style={{ color: PIE_COLORS[i % PIE_COLORS.length], fontWeight: 700, fontSize: '1.4rem', marginBottom: 4 }}>{c.count}</div>
                                <div style={{ fontSize: '0.8rem', color: '#b8a9d0', textTransform: 'capitalize', marginBottom: 4 }}>{c.name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b5a8a' }}>Avg KES {c.avgPrice.toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
