'use client';
import Link from 'next/link';
import { ShoppingBag, Star, MessageCircle } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface Product {
    id?: string;
    _id?: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    size: string;
    condition: string;
    images: string[];
    stock: number;
    isSold?: boolean;
    isFeatured?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
    const addItem = useCartStore((s) => s.addItem);

    const conditionColors: Record<string, string> = {
        excellent: 'badge-green',
        good: 'badge-blue',
        fair: 'badge-orange',
    };

    const categoryEmojis: Record<string, string> = {
        robes: '🥻', onesies: '👘', pajamas: '🌙',
        'night-dresses': '✨', 'baby-onesies': '🍼',
        'pre-teen-robes': '⭐', 'baby-robes': '🐣',
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        if (product.stock === 0 || product.isSold) return;
        addItem({
            productId: product.id || product._id || '',
            name: product.name,
            price: product.price,
            image: product.images[0] || '',
            category: product.category,
            size: product.size,
            condition: product.condition,
        });
        toast.success(`${product.name} added to cart!`);
    };

    const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const phoneNumber = '254722277050';
        const message = encodeURIComponent(`Hi, is ${product.name} still in stock?`);
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    return (
        <Link href={`/products/${product.id || product._id}`} style={{ textDecoration: 'none' }}>
            <div className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
                {/* Image */}
                <div style={{
                    height: 220, overflow: 'hidden', position: 'relative',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(212,175,55,0.1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem',
                }}>
                    {product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }} />
                    ) : (
                        <span>{categoryEmojis[product.category] || '👗'}</span>
                    )}
                    {product.isFeatured && (
                        <div style={{ position: 'absolute', top: 10, left: 10 }}>
                            <span className="badge badge-gold" style={{ gap: 4 }}><Star size={10} fill="#d4af37" /> Featured</span>
                        </div>
                    )}
                    {product.stock === 0 && !product.isSold && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>Out of Stock</span>
                        </div>
                    )}
                    {product.isSold && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                            <div style={{ 
                                width: '140%', height: 40, background: '#ef4444', color: 'white', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase',
                                transform: 'rotate(-35deg)', letterSpacing: 4,
                                boxShadow: '0 4px 15px rgba(239,68,68,0.5)', borderTop: '2px solid white', borderBottom: '2px solid white'
                            }}>
                                SOLD
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: 12 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className={`badge ${conditionColors[product.condition] || 'badge-purple'}`} style={{ fontSize: '0.65rem' }}>{product.condition}</span>
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{product.size}</span>
                    </div>
                    <h3 style={{ 
                        fontSize: '0.9rem', 
                        fontWeight: 600, 
                        color: 'var(--text-primary)', 
                        marginBottom: 6, 
                        fontFamily: 'Inter, sans-serif', 
                        lineHeight: 1.3, 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        height: '2.6em' // Fixed height for alignment
                    }}>
                        {product.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'capitalize' }}>
                        {product.category.replace('-', ' ')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>KES {product.price.toLocaleString()}</span>
                            {product.originalPrice && (
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>KES {product.originalPrice.toLocaleString()}</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={handleWhatsAppClick}
                                style={{
                                    width: 42, height: 42, borderRadius: 10,
                                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                    border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }} title="Inquire via WhatsApp">
                                <MessageCircle size={18} color="#ffffff" />
                            </button>
                            <button onClick={handleAddToCart} disabled={product.stock === 0 || product.isSold}
                                style={{
                                    width: 42, height: 42, borderRadius: 10,
                                    background: (product.stock === 0 || product.isSold) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #d4af37, #f0d060)',
                                    border: 'none', cursor: (product.stock === 0 || product.isSold) ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }} title={product.isSold ? "Item Sold" : "Add to Cart"}>
                                <ShoppingBag size={18} color="#0a0012" />
                            </button>
                        </div>
                    </div>
                    {product.stock > 0 && product.stock <= 5 && (
                        <p style={{ fontSize: '0.75rem', color: '#fb923c', marginTop: 8 }}>⚡ Only {product.stock} left</p>
                    )}
                </div>
            </div>
        </Link>
    );
}
