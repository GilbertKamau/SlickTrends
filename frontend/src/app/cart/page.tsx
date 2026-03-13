'use client';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useCartStore } from '@/store/cartStore';

export default function CartPage() {
    const { items, removeItem, updateQuantity, total, clearCart } = useCartStore();
    const subtotal = total();
    const shippingFee = subtotal > 5000 ? 0 : 200;
    const orderTotal = subtotal + shippingFee;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '50px 0' }}>
                <div className="container">
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', marginBottom: 8 }}>
                        Your <span className="gradient-text">Cart</span>
                    </h1>
                    <p style={{ color: '#6b5a8a', marginBottom: 40 }}>{items.length} item{items.length !== 1 ? 's' : ''}</p>

                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '80px 0' }}>
                            <ShoppingBag size={60} color="#6b5a8a" style={{ margin: '0 auto 24px' }} />
                            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: 12 }}>Your cart is empty</h3>
                            <p style={{ color: '#6b5a8a', marginBottom: 32 }}>Discover amazing second-hand sleepwear</p>
                            <Link href="/products" className="btn-primary" style={{ textDecoration: 'none' }}>Shop Now <ArrowRight size={16} /></Link>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
                            {/* Cart Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {items.map((item) => (
                                    <div key={item.productId} className="glass-card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center' }}>
                                        <div style={{ width: 80, height: 80, borderRadius: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(212,175,55,0.1))', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                            {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👗'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{item.size}</span>
                                                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{item.condition}</span>
                                            </div>
                                            <div style={{ color: '#d4af37', fontWeight: 700 }}>KES {item.price.toLocaleString()}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(124,58,237,0.3)', background: 'transparent', color: '#b8a9d0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                                            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid rgba(124,58,237,0.3)', background: 'transparent', color: '#b8a9d0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                                            <div style={{ fontWeight: 700, marginBottom: 8 }}>KES {(item.price * item.quantity).toLocaleString()}</div>
                                            <button onClick={() => removeItem(item.productId)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                                                <Trash2 size={14} /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={clearCart} style={{ background: 'none', border: 'none', color: '#6b5a8a', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}>
                                    <Trash2 size={14} /> Clear cart
                                </button>
                            </div>

                            {/* Order Summary */}
                            <div className="glass-card" style={{ padding: 28, height: 'fit-content', position: 'sticky', top: 100 }}>
                                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', marginBottom: 24 }}>Order Summary</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8a9d0', fontSize: '0.9rem' }}>
                                        <span>Subtotal</span><span>KES {subtotal.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b8a9d0', fontSize: '0.9rem' }}>
                                        <span>Shipping</span>
                                        <span style={{ color: shippingFee === 0 ? '#10b981' : 'inherit' }}>{shippingFee === 0 ? 'FREE' : `KES ${shippingFee}`}</span>
                                    </div>
                                    {shippingFee > 0 && <p style={{ fontSize: '0.75rem', color: '#6b5a8a' }}>Add KES {(5000 - subtotal).toLocaleString()} for free shipping</p>}
                                    <div style={{ height: 1, background: 'rgba(124,58,237,0.2)' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                                        <span>Total</span><span style={{ color: '#d4af37' }}>KES {orderTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                                <Link href="/checkout" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', marginTop: 28, textDecoration: 'none' }}>
                                    Proceed to Checkout <ArrowRight size={16} />
                                </Link>
                                <Link href="/products" style={{ display: 'block', textAlign: 'center', marginTop: 16, color: '#6b5a8a', textDecoration: 'none', fontSize: '0.875rem' }}>
                                    ← Continue Shopping
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
