'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, Package, Truck, CheckCircle2, Star, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';

interface Order {
    _id: string;
    items: any[];
    totalAmount: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    paymentStatus: string;
    createdAt: string;
}

export default function OrdersPage() {
    const { token } = useAuthStore();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await api.get('/orders/my');
                setOrders(res.data.orders);
            } catch (err) {
                console.error('Failed to fetch orders', err);
            } finally {
                setIsLoading(false);
            }
        };
        if (token) fetchOrders();
    }, [token]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered': return <CheckCircle2 size={18} color="#10b981" />;
            case 'shipped': return <Truck size={18} color="#3b82f6" />;
            case 'processing': return <Package size={18} color="#f59e0b" />;
            default: return <ShoppingBag size={18} color="#6b5a8a" />;
        }
    };

    return (
        <div className="container" style={{ padding: '40px 24px', maxWidth: 1000, minHeight: '80vh' }}>
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: 8 }}>My <span className="gradient-text">Orders</span></h1>
                <p style={{ color: '#6b5a8a' }}>Track and manage your sleepwear collections</p>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '100px 0', color: '#6b5a8a' }}>Loading your orders...</div>
            ) : orders.length === 0 ? (
                <div className="glass-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                        <ShoppingBag size={32} color="#6b5a8a" />
                    </div>
                    <h3 style={{ color: '#f5f0ff', marginBottom: 12 }}>No orders found</h3>
                    <p style={{ color: '#b8a9d0', marginBottom: 24 }}>You haven't placed any orders yet. Start shopping our premium collection!</p>
                    <Link href="/products" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        Browse Products <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {orders.map((order) => (
                        <div key={order._id} className="glass-card" style={{ padding: 24, transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                        <span style={{ color: '#d4af37', fontWeight: 700, fontSize: '1.1rem' }}>Order #{order._id.slice(-6).toUpperCase()}</span>
                                        <div style={{ 
                                            display: 'flex', alignItems: 'center', gap: 6, 
                                            padding: '4px 12px', borderRadius: 20, 
                                            background: 'rgba(124,58,237,0.1)', fontSize: '0.75rem',
                                            textTransform: 'uppercase', letterSpacing: 1, color: '#b8a9d0'
                                        }}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </div>
                                    </div>
                                    <p style={{ color: '#6b5a8a', fontSize: '0.875rem' }}>Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#6b5a8a', fontSize: '0.875rem', marginBottom: 4 }}>Total Amount</p>
                                    <p style={{ color: '#f5f0ff', fontSize: '1.25rem', fontWeight: 700 }}>KES {order.totalAmount.toLocaleString()}</p>
                                </div>
                            </div>

                            <div style={{ height: 1, background: 'rgba(124,58,237,0.1)', margin: '20px 0' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', WebkitOverflowScrolling: 'touch', gap: 12 }}>
                                    {/* Simplified item list indicator */}
                                    <p style={{ color: '#b8a9d0', fontSize: '0.9rem' }}>{order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order</p>
                                </div>
                                <Link href={`/orders/${order._id}`} style={{ color: '#d4af37', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    View Details <ArrowRight size={14} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Featured Collection Banner */}
            <div className="glass-card" style={{ marginTop: 60, padding: 40, background: 'linear-gradient(90deg, rgba(212,175,55,0.05) 0%, rgba(124,58,237,0.05) 100%)', border: '1px solid rgba(212,175,55,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <Star size={20} color="#d4af37" fill="#d4af37" />
                        <span style={{ color: '#d4af37', fontWeight: 700, letterSpacing: 2, fontSize: '0.8rem', textTransform: 'uppercase' }}>Exclusive Offer</span>
                    </div>
                    <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#f5f0ff' }}>Loved your latest order?</h3>
                    <p style={{ color: '#b8a9d0', marginTop: 8 }}>Share your experience on social media and tag #SlickTrends for a 10% discount on your next robe!</p>
                </div>
                <button className="btn-primary" style={{ padding: '12px 32px' }}>Copy Code: SLICK10</button>
            </div>
        </div>
    );
}
