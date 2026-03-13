'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { AdminSidebar } from '../page';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['pending', 'confirmed', 'dispatched', 'delivered', 'closed', 'cancelled'];
const STATUS_COLORS: Record<string, string> = { pending: '#fb923c', confirmed: '#60a5fa', dispatched: '#a78bfa', delivered: '#10b981', closed: '#6b5a8a', cancelled: '#ef4444' };
const STATUS_LABELS: Record<string, string> = { pending: '🕐 Pending', confirmed: '✅ Confirmed', dispatched: '🚚 Dispatched', delivered: '📦 Delivered', closed: '🔒 Closed', cancelled: '❌ Cancelled' };

export default function AdminOrdersPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [selected, setSelected] = useState<string | null>(null);
    const [detail, setDetail] = useState<{ items: unknown[]; transactions: unknown[] } | null>(null);

    useEffect(() => { if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) router.push('/auth/login'); }, [user, router]);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get(`/orders${filter ? `?status=${filter}` : ''}`); setOrders(r.data.orders || []); } catch { /* silent */ } finally { setLoading(false); }
    }, [filter]);
    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const fetchDetail = async (id: string) => {
        try { const r = await api.get(`/orders/${id}`); setDetail(r.data.order); setSelected(id); } catch { toast.error('Failed to load order details'); }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.patch(`/orders/${id}/status`, { status });
            toast.success(`Order marked as ${status}`);
            fetchOrders();
            if (selected === id) fetchDetail(id);
        } catch { toast.error('Failed to update status'); }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar active="/admin/orders" />
            <main className="admin-main">
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>Orders Management</h1>
                    <p style={{ color: '#6b5a8a', marginTop: 4 }}>{orders.length} orders</p>
                </div>

                {/* Status Filter Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                    {['', ...STATUS_FLOW].map((s) => (
                        <button key={s} onClick={() => setFilter(s)}
                            style={{ padding: '7px 16px', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', borderColor: filter === s ? (STATUS_COLORS[s] || '#d4af37') : 'rgba(124,58,237,0.2)', background: filter === s ? `${STATUS_COLORS[s] || '#d4af37'}20` : 'transparent', color: filter === s ? (STATUS_COLORS[s] || '#d4af37') : '#6b5a8a' }}>
                            {s ? STATUS_LABELS[s] : '📋 All Orders'}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 24 }}>
                    {/* Orders Table */}
                    <div className="glass-card" style={{ padding: 8 }}>
                        {loading ? <div className="spinner" /> : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
                                            {['Order ID', 'Customer', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                                                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6b5a8a', fontWeight: 500 }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {orders.map((o: any) => (
                                            <tr key={o.id} onClick={() => fetchDetail(o.id)} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)', cursor: 'pointer', background: selected === o.id ? 'rgba(212,175,55,0.05)' : 'transparent' }}>
                                                <td style={{ padding: '12px 16px', color: '#b8a9d0', fontFamily: 'monospace', fontSize: '0.75rem' }}>{o.id.slice(0, 8)}…</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ fontWeight: 600, color: '#f5f0ff' }}>{o.user_name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#6b5a8a' }}>{o.user_email}</div>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: '#d4af37', fontWeight: 700 }}>KES {Number(o.total).toLocaleString()}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <span style={{ color: STATUS_COLORS[o.status] || '#b8a9d0', fontWeight: 600 }}>
                                                        {STATUS_LABELS[o.status] || o.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 16px', color: '#6b5a8a', fontSize: '0.8rem' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                                                <td style={{ padding: '12px 16px' }}>
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <select onChange={(e) => { e.stopPropagation(); if (e.target.value) updateStatus(o.id, e.target.value); e.target.value = ''; }}
                                                            defaultValue=""
                                                            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 6, padding: '5px 8px', color: '#b8a9d0', fontSize: '0.8rem', cursor: 'pointer', outline: 'none' }}
                                                            onClick={e => e.stopPropagation()}>
                                                            <option value="">Update…</option>
                                                            {STATUS_FLOW.filter(s => s !== o.status).map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {orders.length === 0 && <p style={{ textAlign: 'center', color: '#6b5a8a', padding: '40px 0' }}>No orders found</p>}
                            </div>
                        )}
                    </div>

                    {/* Order Detail Panel */}
                    {selected && detail && (
                        <div className="glass-card" style={{ padding: 24, height: 'fit-content', position: 'sticky', top: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' }}>Order Details</h3>
                                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#6b5a8a', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                            </div>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(detail as any).shipping_address && (
                                <div style={{ marginBottom: 16, padding: 14, background: 'rgba(124,58,237,0.1)', borderRadius: 10 }}>
                                    <div style={{ fontSize: '0.75rem', color: '#6b5a8a', marginBottom: 6 }}>SHIP TO</div>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {(() => { const a = (detail as any).shipping_address; return <div style={{ fontSize: '0.875rem', color: '#b8a9d0' }}>{a.street}, {a.city}, {a.country}</div>; })()}
                                </div>
                            )}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '0.75rem', color: '#6b5a8a', marginBottom: 10 }}>ITEMS</div>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {(detail.items as any[]).map((item: any) => (
                                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(124,58,237,0.1)', fontSize: '0.825rem' }}>
                                        <span style={{ color: '#b8a9d0' }}>{item.product_name} <span style={{ color: '#6b5a8a' }}>× {item.quantity}</span></span>
                                        <span style={{ color: '#d4af37' }}>KES {Number(item.total_price).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: 20 }}><span>Total</span><span style={{ color: '#d4af37' }}>KES {Number((detail as any).total).toLocaleString()}</span></div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {STATUS_FLOW.filter(s => s !== (detail as any).status).map(s => (
                                    <button key={s} onClick={() => updateStatus(selected, s)} style={{ padding: '9px', borderRadius: 8, border: `1px solid ${STATUS_COLORS[s]}40`, background: `${STATUS_COLORS[s]}15`, color: STATUS_COLORS[s], cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                                        Mark as {STATUS_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
