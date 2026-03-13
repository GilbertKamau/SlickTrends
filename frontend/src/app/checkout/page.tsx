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
    { id: 'stripe', label: 'Stripe', icon: CreditCard, desc: 'Pay with debit/credit card', color: '#635bff' },
    { id: 'paypal', label: 'PayPal', icon: Globe, desc: 'Pay with PayPal balance', color: '#0070ba' },
    { id: 'card', label: 'Visa / Mastercard', icon: CreditCard, desc: 'Enter card details directly', color: '#d4af37' },
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
            <main style={{ flex: 1, padding: '50px 0' }}>
                <div className="container" style={{ maxWidth: 900 }}>
                    <Link href="/cart" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b5a8a', textDecoration: 'none', marginBottom: 32, fontSize: '0.875rem' }}>
                        <ArrowLeft size={14} /> Back to Cart
                    </Link>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: 36 }}>
                        <span className="gradient-text">Checkout</span>
                    </h1>

                    {/* Steps */}
                    <div style={{ display: 'flex', gap: 0, marginBottom: 40 }}>
                        {(['address', 'payment', 'confirm'] as const).map((s, i) => (
                            <div key={s} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step === s || (i === 0 && step !== 'address') ? 'linear-gradient(135deg, #d4af37, #f0d060)' : 'rgba(124,58,237,0.2)', border: '2px solid', borderColor: step === s ? '#d4af37' : 'rgba(124,58,237,0.3)', color: step === s ? '#0a0012' : '#b8a9d0', fontWeight: 700, fontSize: '0.85rem' }}>
                                        {i === 0 && step !== 'address' ? <Check size={16} color="#0a0012" /> : i + 1}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: step === s ? '#d4af37' : '#6b5a8a', marginTop: 6, textTransform: 'capitalize' }}>{s}</div>
                                </div>
                                {i < 2 && <div style={{ flex: 2, height: 2, background: i < ['address', 'payment', 'confirm'].indexOf(step) ? '#d4af37' : 'rgba(124,58,237,0.2)', margin: '0 8px', marginBottom: 24 }} />}
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32 }}>
                        {/* Left Panel */}
                        <div>
                            {step === 'address' && (
                                <div className="glass-card" style={{ padding: 32 }}>
                                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: 24 }}>Shipping Address</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                        <div>
                                            <label className="input-label">Street Address</label>
                                            <input className="input-field" placeholder="123 Kenyatta Ave" value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} required />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                            <div>
                                                <label className="input-label">City</label>
                                                <input className="input-field" placeholder="Nairobi" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} required />
                                            </div>
                                            <div>
                                                <label className="input-label">Postal Code</label>
                                                <input className="input-field" placeholder="00100" value={address.postalCode} onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="input-label">Country</label>
                                            <input className="input-field" value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))} />
                                        </div>
                                        <button className="btn-primary" onClick={() => { if (!address.street || !address.city) { toast.error('Please enter street and city'); return; } setStep('payment'); }} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                                            Continue to Payment →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'payment' && (
                                <div className="glass-card" style={{ padding: 32 }}>
                                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: 24 }}>Payment Method</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {PAYMENT_METHODS.map((pm) => (
                                            <button key={pm.id} onClick={() => setPayMethod(pm.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 12, border: '2px solid', borderColor: payMethod === pm.id ? pm.color : 'rgba(124,58,237,0.2)', background: payMethod === pm.id ? `${pm.color}15` : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s' }}>
                                                <pm.icon size={22} color={pm.color} />
                                                <div>
                                                    <div style={{ fontWeight: 600, color: '#f5f0ff' }}>{pm.label}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#6b5a8a' }}>{pm.desc}</div>
                                                </div>
                                                {payMethod === pm.id && <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: pm.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={13} color="#fff" /></div>}
                                            </button>
                                        ))}
                                    </div>

                                    {payMethod === 'mpesa' && (
                                        <div style={{ marginTop: 20 }}>
                                            <label className="input-label">M-Pesa Phone Number</label>
                                            <input className="input-field" type="tel" placeholder="254700000000" value={mpesaPhone} onChange={e => setMpesaPhone(e.target.value)} />
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                                        <button className="btn-ghost" onClick={() => setStep('address')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                                        <button className="btn-primary" onClick={() => setStep('confirm')} style={{ flex: 2, justifyContent: 'center' }}>Review Order →</button>
                                    </div>
                                </div>
                            )}

                            {step === 'confirm' && (
                                <div className="glass-card" style={{ padding: 32 }}>
                                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: 24 }}>Confirm Order</h2>
                                    <div style={{ marginBottom: 20 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#6b5a8a', marginBottom: 6 }}>SHIPPING TO</div>
                                        <div style={{ color: '#b8a9d0' }}>{address.street}, {address.city}, {address.country}</div>
                                    </div>
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#6b5a8a', marginBottom: 6 }}>PAYMENT METHOD</div>
                                        <div style={{ color: '#b8a9d0' }}>{PAYMENT_METHODS.find(p => p.id === payMethod)?.label}</div>
                                    </div>
                                    {items.map((item) => (
                                        <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(124,58,237,0.1)', fontSize: '0.875rem', color: '#b8a9d0' }}>
                                            <span>{item.name} × {item.quantity}</span>
                                            <span>KES {(item.price * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
                                        <button className="btn-ghost" onClick={() => setStep('payment')} style={{ flex: 1, justifyContent: 'center' }}>← Back</button>
                                        <button className="btn-primary" onClick={placeOrder} disabled={loading} style={{ flex: 2, justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                                            {loading ? 'Placing Order...' : `Place Order — KES ${orderTotal.toLocaleString()}`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Order Summary */}
                        <div className="glass-card" style={{ padding: 24, height: 'fit-content' }}>
                            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', marginBottom: 20 }}>Summary</h3>
                            {items.map((item) => (
                                <div key={item.productId} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(124,58,237,0.2)', flexShrink: 0, overflow: 'hidden', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {item.image ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👗'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.8rem', color: '#b8a9d0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b5a8a' }}>× {item.quantity}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#d4af37', fontWeight: 600 }}>KES {(item.price * item.quantity).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))}
                            <div style={{ height: 1, background: 'rgba(124,58,237,0.2)', margin: '16px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8a9d0', fontSize: '0.875rem', marginBottom: 8 }}>
                                <span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8a9d0', fontSize: '0.875rem', marginBottom: 14 }}>
                                <span>Shipping</span><span style={{ color: shippingFee === 0 ? '#10b981' : 'inherit' }}>{shippingFee === 0 ? 'FREE' : `KES ${shippingFee}`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem' }}>
                                <span>Total</span><span style={{ color: '#d4af37' }}>KES {orderTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
