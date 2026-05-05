'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShoppingBag, MessageCircle, Star, ArrowLeft, Shield, Truck, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import api from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeImageIdx, setActiveImageIdx] = useState(0);
    const addItem = useCartStore((s) => s.addItem);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${id}`);
                setProduct(res.data.product);
            } catch (err) {
                toast.error('Product not found');
                router.push('/products');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProduct();
    }, [id, router]);

    const handleAddToCart = () => {
        if (!product || product.stock === 0 || product.isSold) return;
        addItem({
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images[0] || '',
            category: product.category,
            size: product.size,
            condition: product.condition,
        });
        toast.success(`${product.name} added to cart!`);
    };

    const handleWhatsAppClick = () => {
        if (!product) return;
        const phoneNumber = '254722277050';
        const message = encodeURIComponent(`Hi, I'm interested in the ${product.name} (KES ${product.price.toLocaleString()}). Is it still available?`);
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    if (loading) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </main>
            <Footer />
        </div>
    );

    if (!product) return null;

    const conditionColors: Record<string, string> = {
        excellent: 'badge-green',
        good: 'badge-blue',
        fair: 'badge-orange',
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
            <Navbar />
            
            <main style={{ flex: 1, padding: '40px 0' }}>
                <div className="container">
                    {/* Breadcrumbs / Back */}
                    <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 32, fontSize: '0.9rem' }}>
                        <ArrowLeft size={16} /> Back to Products
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 60, alignItems: 'start' }}>
                        
                        {/* ─── Left: Image Gallery ─────────────────────────── */}
                        <div style={{ position: 'sticky', top: 100 }}>
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 24, position: 'relative', aspectRatio: '4/5', background: 'rgba(255,255,255,0.02)' }}>
                                {product.images.length > 0 ? (
                                    <img 
                                        src={product.images[activeImageIdx]} 
                                        alt={product.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    />
                                ) : (
                                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem', opacity: 0.2 }}>👗</div>
                                )}
                                
                                {product.isSold && (
                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ 
                                            width: '120%', height: 60, background: '#ef4444', color: 'white', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase',
                                            transform: 'rotate(-25deg)', letterSpacing: 8, boxShadow: '0 8px 30px rgba(239,68,68,0.5)'
                                        }}>
                                            SOLD
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Arrows */}
                                {product.images.length > 1 && (
                                    <>
                                        <button 
                                            onClick={() => setActiveImageIdx(prev => (prev === 0 ? product.images.length - 1 : prev - 1))}
                                            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button 
                                            onClick={() => setActiveImageIdx(prev => (prev === product.images.length - 1 ? 0 : prev + 1))}
                                            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.images.length > 1 && (
                                <div style={{ display: 'flex', gap: 12, marginTop: 20, overflowX: 'auto', paddingBottom: 8 }}>
                                    {product.images.map((img: string, idx: number) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setActiveImageIdx(idx)}
                                            style={{ 
                                                width: 80, height: 100, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                                                border: activeImageIdx === idx ? '2px solid var(--accent-gold)' : '2px solid transparent',
                                                padding: 0, cursor: 'pointer', opacity: activeImageIdx === idx ? 1 : 0.6, transition: '0.2s'
                                            }}
                                        >
                                            <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ─── Right: Product Info ─────────────────────────── */}
                        <div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                                <span className={`badge ${conditionColors[product.condition] || 'badge-purple'}`}>{product.condition} Only</span>
                                <span className="badge badge-purple">Size {product.size}</span>
                                <span className="badge badge-gold" style={{ gap: 4 }}><Star size={10} fill="#d4af37" /> Premium</span>
                            </div>

                            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: 8, lineHeight: 1.2 }}>{product.name}</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: 24, textTransform: 'capitalize' }}>{product.category?.replace('-', ' ') || 'Uncategorized'}</p>

                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
                                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>KES {product.price.toLocaleString()}</span>
                                {product.originalPrice && (
                                    <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>KES {product.originalPrice.toLocaleString()}</span>
                                )}
                            </div>

                            <div className="glass-card" style={{ padding: 24, marginBottom: 32, background: 'rgba(255,255,255,0.01)' }}>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>{product.description}</p>
                            </div>

                            {/* Details Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 20, marginBottom: 40 }}>
                                {[
                                    { label: 'Brand', value: product.brand || 'Premium Thrifed' },
                                    { label: 'Color', value: product.color || 'As Shown' },
                                    { label: 'Material', value: product.material || 'Mixed Fabrics' },
                                    { label: 'Stock', value: product.stock > 0 ? `${product.stock} Available` : 'Out of Stock' },
                                ].map(({ label, value }) => (
                                    <div key={label}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
                                <button 
                                    onClick={handleAddToCart}
                                    disabled={product.stock === 0 || product.isSold}
                                    style={{ flex: 1, minWidth: 200 }}
                                    className="btn-primary"
                                >
                                    <ShoppingBag size={20} /> {product.isSold ? 'Sold Out' : 'Add to Cart'}
                                </button>
                                <button 
                                    onClick={handleWhatsAppClick}
                                    style={{ flex: 1, minWidth: 200, background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
                                    className="btn-primary"
                                >
                                    <MessageCircle size={20} /> Inquire WhatsApp
                                </button>
                            </div>

                            {/* Trust Section */}
                            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 32 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                    {[
                                        { icon: Truck, title: 'Island-wide Delivery', desc: 'Fast shipping within 24-48 hours' },
                                        { icon: Shield, title: 'Quality Assured', desc: 'Every item is hand-picked and sanitized' },
                                        { icon: RefreshCw, title: 'Easy Exchanges', desc: 'Within 7 days of purchase' },
                                        { icon: Star, title: 'Secure Payment', desc: 'Secure M-Pesa mobile payment' },
                                    ].map(({ icon: Icon, title, desc }) => (
                                        <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <Icon size={20} color="var(--accent-gold)" style={{ marginTop: 2, flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
