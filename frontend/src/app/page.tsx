'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Truck, RefreshCw, Star, Megaphone } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const CATEGORIES = [
  { value: 'robes', label: 'Robes', emoji: '🥻', desc: 'Luxurious robes for all sizes' },
  { value: 'onesies', label: 'Onesies', emoji: '👘', desc: 'Cozy full-body comfort' },
  { value: 'pajamas', label: 'Pajamas', emoji: '🌙', desc: 'Perfect sleep sets' },
  { value: 'night-dresses', label: 'Night Dresses', emoji: '✨', desc: 'Elegant nightwear' },
  { value: 'baby-onesies', label: 'Baby Onesies', emoji: '🍼', desc: 'Soft onesies for babies' },
  { value: 'pre-teen-robes', label: 'Pre-Teen Robes', emoji: '⭐', desc: 'For kids aged 6–12' },
  { value: 'baby-robes', label: 'Baby Robes', emoji: '🐣', desc: 'Tiny & adorable robes' },
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setHasMounted(true);
    // Fetch featured products
    api.get('/products?featured=true&limit=8')
      .then(r => setFeatured(r.data.products))
      .catch(() => { });

    // Fetch active promotions
    api.get('/promotions/active')
      .then(r => setPromotions(r.data.promotions))
      .catch(() => { });

    setLoading(false);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* ─── Hero ─────────────────────────────────────────────────────── */}
        <section style={{
          minHeight: '88vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(212,175,55,0.1) 0%, transparent 60%)',
        }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(124,58,237,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }} />
          <div className="container" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
            <div style={{ maxWidth: 700 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 28 }}>
                <Star size={14} fill="#d4af37" color="#d4af37" />
                <span style={{ fontSize: '0.8rem', color: '#d4af37', fontWeight: 600, letterSpacing: 1 }}>SUSTAINABLE LUXURY SLEEPWEAR</span>
              </div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontFamily: 'Playfair Display, serif', lineHeight: 1.15, marginBottom: 24 }}>
                Sleep in Style,<br />
                <span className="gradient-text">Shop Sustainably</span>
              </h1>
              <p style={{ fontSize: '1.15rem', color: '#b8a9d0', lineHeight: 1.8, marginBottom: 40, maxWidth: 520 }}>
                Discover curated second-hand robes, onesies, pajamas and nightwear for the whole family. Premium quality at a fraction of the price.
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link href="/products" className="btn-primary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 32px' }}>
                  Shop Now <ArrowRight size={18} />
                </Link>
                {hasMounted && !user && (
                    <Link href="/auth/register" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '13px 32px' }}>
                      Create Free Account
                    </Link>
                )}
                {hasMounted && user && (
                    <Link href="/products?featured=true" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '1rem', padding: '13px 32px' }}>
                      View Featured
                    </Link>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 40, marginTop: 56, flexWrap: 'wrap' }}>
                {[['500+', 'Products'], ['2,000+', 'Happy Customers'], ['7', 'Categories']].map(([num, lbl]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d4af37', fontFamily: 'Playfair Display, serif' }}>{num}</div>
                    <div style={{ fontSize: '0.85rem', color: '#6b5a8a', marginTop: 4 }}>{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── Internal Promotions (Holiday Deals) ───────────────────── */}
        {hasMounted && promotions.length > 0 && (
          <section className="section" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <h2 style={{ fontSize: '2rem', marginBottom: 12 }}>Special <span className="gradient-text">Holiday Deals</span></h2>
                <p style={{ color: 'var(--text-secondary)' }}>Limited time offers just for you</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                {promotions.map((promo: any) => (
                  <Link key={promo._id} href={promo.link} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ position: 'relative', overflow: 'hidden', height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 24 }}>
                      <img src={promo.imageUrl} alt={promo.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, transition: '0.3s' }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="badge-gold" style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, marginBottom: 12, background: 'var(--accent-gold)', color: '#000' }}>
                          {promo.type.toUpperCase()}
                        </div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: 4, color: 'var(--text-primary)' }}>{promo.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{promo.subtitle}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── Categories ──────────────────────────────────────────────── */}
        <section className="section" style={{ background: 'rgba(17, 0, 35, 0.5)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', marginBottom: 12 }}>
                Shop by <span className="gradient-text">Category</span>
              </h2>
              <p style={{ color: '#b8a9d0' }}>7 categories of premium second-hand sleepwear</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
              {CATEGORIES.map((cat) => (
                <Link key={cat.value} href={`/products?category=${cat.value}`} style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ padding: '28px 16px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 14 }}>{cat.emoji}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f5f0ff', marginBottom: 6 }}>{cat.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b5a8a', lineHeight: 1.5 }}>{cat.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Featured Products ───────────────────────────────────────── */}
        <section className="section">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
              <div>
                <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', marginBottom: 8 }}>
                  Featured <span className="gradient-text">Picks</span>
                </h2>
                <p style={{ color: '#b8a9d0' }}>Hand-selected pieces you&apos;ll love</p>
              </div>
              <Link href="/products?featured=true" className="btn-secondary" style={{ textDecoration: 'none' }}>
                View All <ArrowRight size={16} />
              </Link>
            </div>
            {loading ? (
              <div className="product-grid">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 20 }} />)}
              </div>
            ) : featured.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ color: '#6b5a8a' }}>No featured products yet. Check back soon!</p>
                <Link href="/products" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: 20 }}>Browse All Products</Link>
              </div>
            ) : (
              <div className="product-grid">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {featured.map((p: any) => <ProductCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        </section>

        {/* ─── Trust Badges ────────────────────────────────────────────── */}
        <section style={{ background: 'rgba(17,0,35,0.5)', padding: '60px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
              {[
                { icon: Truck, title: 'Free Shipping', desc: 'On all orders over KES 5,000' },
                { icon: Shield, title: 'Secure Payments', desc: 'Secure M-Pesa & PayPal integration' },
                { icon: RefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
                { icon: Star, title: 'Quality Checked', desc: 'Every item inspected before listing' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card" style={{ padding: 28, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(124,58,237,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={22} color="#d4af37" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b5a8a', lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ──────────────────────────────────────────────── */}
        <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(212,175,55,0.1))' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: 16 }}>
              Ready to <span className="gradient-text">Shop Sustainably?</span>
            </h2>
            <p style={{ color: '#b8a9d0', fontSize: '1.1rem', marginBottom: 36 }}>
              Join thousands of happy customers making eco-friendly choices.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {hasMounted && !user && (
                  <Link href="/auth/register" className="btn-primary" style={{ textDecoration: 'none', padding: '14px 36px', fontSize: '1rem' }}>Create Free Account</Link>
              )}
              <Link href="/products" className="btn-secondary" style={{ textDecoration: 'none', padding: '13px 36px', fontSize: '1rem' }}>Browse Products</Link>
            </div>
          </div>
        </section>

        {/* ─── Sponsored Section (Google Ads) ─────────────────────────── */}
        <section style={{ padding: '60px 0', background: 'var(--bg-primary)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div style={{ 
              maxWidth: 970, margin: '0 auto', 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px dashed var(--text-muted)',
              borderRadius: 8, padding: '40px 20px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: 2 }}>SPONSORED ADVERTISEMENT</span>
              <div style={{ color: 'var(--text-muted)', filter: 'grayscale(1)', opacity: 0.5 }}>
                <Megaphone size={32} style={{ marginBottom: 12 }} />
                <p>Google Ads Space</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Visit Our Store (Google Maps) ─────────────────────────── */}
        <section className="section" style={{ background: 'rgba(8,0,15,0.8)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.2rem', marginBottom: 12 }}>
                Visit Our <span className="gradient-text">Physical Store</span>
              </h2>
              <p style={{ color: '#b8a9d0' }}>Come see our curated collection in person</p>
            </div>
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', height: 450, borderRadius: 24, border: '1px solid rgba(212,175,55,0.2)' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31911.3656111059!2d36.7142752!3d-1.2384736!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f18ce08709511%3A0xc3f17478059082ec!2sWangige!5e0!3m2!1sen!2ske!4v1710500000000!5m2!1sen!2ske"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <p style={{ color: '#d4af37', fontWeight: 600 }}>📍 Wangige, Kiambu (Opposite Shade ya Mayai)</p>
              <p style={{ color: '#6b5a8a', fontSize: '0.9rem' }}>Open Monday - Saturday: 9:00 AM - 7:00 PM</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
