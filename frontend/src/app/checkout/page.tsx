'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, Smartphone, Globe, Check, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MpesaPayment from '@/components/MpesaPayment';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';


const PAYMENT_METHODS = [
    { id: 'mpesa', label: 'M-Pesa', icon: Smartphone, desc: 'Pay via M-Pesa STK Push', color: '#10b981' },
];

export default function CheckoutPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { items, total, clearCart } = useCartStore();
    const [step, setStep] = useState<'address' | 'payment' | 'confirm'>('address');
    const [payMethod, setPayMethod] = useState('mpesa');
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState({ street: '', city: '', country: 'Kenya', postalCode: '' });
    const [mpesaPhone, setMpesaPhone] = useState('');
    const subtotal = total();
    const shippingFee = subtotal > 5000 ? 0 : 200;
    const orderTotal = subtotal + shippingFee;

    useEffect(() => { if (!user) { toast.error('Please sign in to checkout'); router.push('/auth/login'); } }, [user, router]);
    useEffect(() => { if (items.length === 0) router.push('/cart'); }, [items, router]);

    const placeOrder = async () => {
        setLoading(true);
        try {
            const orderRes = await api.post('/orders', {
                items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
                shippingAddress: address,
                userName: user?.name,
            });
            const orderId = orderRes.data.order.id;

            if (payMethod === 'mpesa') {
                await api.post('/payments/mpesa/stkpush', { phone: mpesaPhone, amount: orderTotal, orderId });
                toast.success('M-Pesa prompt sent! Check your phone to complete payment.');
            } else if (payMethod === 'paypal') {
                const ppRes = await api.post('/payments/paypal/create-order', { orderId, amount: orderTotal / 115 });
                toast.success(`PayPal order created. ID: ${ppRes.data.paypalOrderId}`);
            } else {
                toast.success('Order placed! Complete payment to confirm.');
            }

            clearCart();
            router.push(`/orders/my/${orderId}?success=true`);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Order failed';
            toast.error(msg);
        } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '40px 0' }}>
                <div className="container" style={{ maxWidth: 1000 }}>
                    <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 24, fontSize: '0.875rem' }}>
                        <ArrowLeft size={14} /> Back to Cart
                    </Link>
                    
                    <h1 style={{ marginBottom: 32, fontSize: '2rem' }}>
                        <span className="gradient-text">Checkout</span>
                    </h1>

                    {/* Progress Steps */}
                    <div style={{ display: 'flex', gap: 0, marginBottom: 40, overflowX: 'auto', paddingBottom: 8 }}>
                        {(['address', 'payment', 'confirm'] as const).map((s, i) => (
                            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 100 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <div style={{ 
                                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                        background: step === s ? 'var(--gradient-gold)' : (['address', 'payment', 'confirm'].indexOf(step) > i ? 'var(--accent-gold)' : 'rgba(124,58,237,0.1)'), 
                                        color: step === s || (['address', 'payment', 'confirm'].indexOf(step) > i) ? '#0a0012' : 'var(--text-muted)', 
                                        fontWeight: 700, fontSize: '0.8rem', border: '2px solid', borderColor: step === s ? 'var(--accent-gold)' : 'transparent' 
                                    }}>
                                        {(['address', 'payment', 'confirm'].indexOf(step) > i) ? <Check size={14} /> : i + 1}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: step === s ? 'var(--accent-gold)' : 'var(--text-muted)', marginTop: 8, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>{s}</div>
                                </div>
                                {i < 2 && <div style={{ flex: 2, height: 2, background: i < ['address', 'payment', 'confirm'].indexOf(step) ? 'var(--accent-gold)' : 'rgba(124,58,237,0.1)', margin: '0 8px', marginBottom: 24 }} />}
                            </div>
                        ))}
                    </div>

                    <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
                        <style>{`
                            @media (max-width: 900px) {
                                .checkout-grid { grid-template-columns: 1fr !important; }
                                .order-summary-sidebar { order: -1; margin-bottom: 24px; }
                            }
                        `}</style>
                        
                        {/* Left Panel */}
                        <div className="checkout-main-content">
                            {step === 'address' && (
                                <section className="glass-card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: 24 }}>Shipping Address</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div>
                                            <label className="input-label">Street Address</label>
                                            <input id="street" className="input-field" placeholder="e.g. 123 Kenyatta Ave, Apt 4" value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} required />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <label className="input-label">City</label>
                                                <input id="city" className="input-field" placeholder="Nairobi" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} required />
                                            </div>
                                            <div>
                                                <label className="input-label">Postal Code</label>
                                                <input id="postal" className="input-field" placeholder="00100" value={address.postalCode} onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="input-label">Country</label>
                                            <input className="input-field" value={address.country} disabled style={{ opacity: 0.7 }} />
                                        </div>
                                        <button className="btn-primary" onClick={() => { if (!address.street || !address.city) { toast.error('Please enter street and city'); return; } setStep('payment'); }} style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}>
                                            Continue to Payment →
                                        </button>
                                    </div>
                                </section>
                            )}

                            {step === 'payment' && (
                                <section className="glass-card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: 24 }}>Payment Method</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                        {PAYMENT_METHODS.map((pm) => (
                                            <button key={pm.id} id={`pay-${pm.id}`} onClick={() => setPayMethod(pm.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', borderRadius: 16, border: '2px solid', borderColor: payMethod === pm.id ? pm.color : 'rgba(255,255,255,0.05)', background: payMethod === pm.id ? `${pm.color}10` : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${pm.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <pm.icon size={24} color={pm.color} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1rem' }}>{pm.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pm.desc}</div>
                                                </div>
                                                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: payMethod === pm.id ? pm.color : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {payMethod === pm.id && <div style={{ width: 10, height: 10, borderRadius: '50%', background: pm.color }} />}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {payMethod === 'mpesa' && (
                                        <div style={{ marginTop: 24, padding: 20, background: 'rgba(16, 185, 129, 0.05)', borderRadius: 16, border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                                            <label className="input-label" style={{ color: '#10b981' }}>M-Pesa Phone Number</label>
                                            <input id="mpesa-phone" className="input-field" type="tel" placeholder="2547XXXXXXXX" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }} />
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>Enter number starting with 254. You'll receive a prompt on your phone.</p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                                        <button className="btn-ghost" onClick={() => setStep('address')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                                        <button className="btn-primary" onClick={() => setStep('confirm')} style={{ flex: 2, justifyContent: 'center' }}>Review Order →</button>
                                    </div>
                                </section>
                            )}

                            {step === 'confirm' && (
                                <section className="glass-card" style={{ padding: 'clamp(20px, 5vw, 32px)' }}>
                                    <h2 style={{ fontSize: '1.25rem', marginBottom: 24 }}>Final Confirmation</h2>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 32 }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Shipping To</div>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{address.street}, {address.city}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Payment Method</div>
                                            <div style={{ color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Smartphone size={16} color="#10b981" />
                                                {PAYMENT_METHODS.find(p => p.id === payMethod)?.label}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: 32 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Included Items</div>
                                        {items.map((item) => (
                                            <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{item.name} <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>× {item.quantity}</span></span>
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>KES {(item.price * item.quantity).toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <button id="place-order-btn" className="btn-primary" onClick={placeOrder} disabled={loading} style={{ padding: '16px', fontSize: '1.05rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                                            {loading ? 'Processing...' : `Pay & Confirm Order — KES ${orderTotal.toLocaleString()}`}
                                        </button>
                                        <button className="btn-ghost" onClick={() => setStep('payment')} style={{ justifyContent: 'center' }}>← Change Payment Method</button>
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Order Summary Sidebar */}
                        <aside className="order-summary-sidebar">
                            <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 100 }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Order Summary</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {items.map((item) => (
                                        <div key={item.productId} style={{ display: 'flex', gap: 12 }}>
                                            <div style={{ width: 50, height: 60, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                                <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>KES {item.price.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="divider" style={{ margin: '20px 0' }} />
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span>Shipping</span><span style={{ color: shippingFee === 0 ? '#10b981' : 'inherit' }}>{shippingFee === 0 ? 'FREE' : `KES ${shippingFee}`}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: 10, color: 'var(--accent-gold)' }}>
                                        <span>Total</span><span>KES {orderTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
