'use client';
import Link from 'next/link';
import { ShoppingBag, Instagram, Twitter, Facebook } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            background: 'rgba(8, 0, 15, 0.95)',
            borderTop: '1px solid rgba(212, 175, 55, 0.15)',
            padding: '60px 0 30px',
            marginTop: 'auto',
        }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 50 }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f0d060)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShoppingBag size={16} fill="#0a0012" color="#0a0012" />
                            </div>
                            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem', fontWeight: 700 }}>
                                <span className="gradient-text">Slick</span>
                                <span style={{ color: '#b8a9d0' }}> Trends</span>
                            </span>
                        </div>
                        <p style={{ color: '#6b5a8a', fontSize: '0.875rem', lineHeight: 1.7 }}>
                            Curated second-hand sleepwear for the whole family. Sustainable, stylish, and affordable.
                        </p>
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            {[Instagram, Twitter, Facebook].map((Icon, i) => (
                                <a key={i} href="#" style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8a9d0', transition: 'all 0.2s' }}>
                                    <Icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 style={{ color: '#d4af37', fontFamily: 'Playfair Display, serif', marginBottom: 20, fontSize: '1rem' }}>Shop</h4>
                        {['Robes', 'Onesies', 'Pajamas', 'Night Dresses', 'Baby Onesies', 'Pre-Teen Robes'].map((cat) => (
                            <Link key={cat} href={`/products?category=${cat.toLowerCase().replace(' ', '-')}`}
                                style={{ display: 'block', color: '#6b5a8a', textDecoration: 'none', marginBottom: 10, fontSize: '0.875rem', transition: 'color 0.2s' }}>
                                {cat}
                            </Link>
                        ))}
                    </div>

                    {/* Account */}
                    <div>
                        <h4 style={{ color: '#d4af37', fontFamily: 'Playfair Display, serif', marginBottom: 20, fontSize: '1rem' }}>Account</h4>
                        {[
                            { label: 'My Account', href: '/profile' },
                            { label: 'My Orders', href: '/orders' },
                            { label: 'Cart', href: '/cart' },
                            { label: 'Register', href: '/auth/register' },
                        ].map((l) => (
                            <Link key={l.label} href={l.href} style={{ display: 'block', color: '#6b5a8a', textDecoration: 'none', marginBottom: 10, fontSize: '0.875rem' }}>{l.label}</Link>
                        ))}
                    </div>

                    {/* Info */}
                    <div>
                        <h4 style={{ color: '#d4af37', fontFamily: 'Playfair Display, serif', marginBottom: 20, fontSize: '1rem' }}>Info</h4>
                        <p style={{ color: '#6b5a8a', fontSize: '0.875rem', marginBottom: 10 }}>📦 Free shipping over KES 5,000</p>
                        <p style={{ color: '#6b5a8a', fontSize: '0.875rem', marginBottom: 10 }}>🔄 Easy returns within 7 days</p>
                        <p style={{ color: '#6b5a8a', fontSize: '0.875rem', marginBottom: 10 }}>💳 MPesa, Stripe, PayPal accepted</p>
                        <p style={{ color: '#6b5a8a', fontSize: '0.875rem' }}>📧 support@slicktrends.com</p>
                    </div>
                </div>

                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)', marginBottom: 30 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                    <p style={{ color: '#6b5a8a', fontSize: '0.8rem' }}>© {new Date().getFullYear()} Slick Trends. All rights reserved.</p>
                    <div style={{ display: 'flex', gap: 20 }}>
                        {['Privacy Policy', 'Terms of Service'].map((t) => (
                            <a key={t} href="#" style={{ color: '#6b5a8a', fontSize: '0.8rem', textDecoration: 'none' }}>{t}</a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
