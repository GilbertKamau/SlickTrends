'use client';
import Link from 'next/link';
import { ShoppingBag, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface Product {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    category: string;
    size: string;
    condition: string;
    images: string[];
    stock: number;
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
        if (product.stock === 0) return;
        addItem({
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.images[0] || '',
            category: product.category,
            size: product.size,
            condition: product.condition,
        });
        toast.success(`${product.name} added to cart!`);
    };

    return (
        <Link href={`/products/${product._id}`} style={{ textDecoration: 'none' }}>
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
                    {product.stock === 0 && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>Out of Stock</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                        <span className={`badge ${conditionColors[product.condition] || 'badge-purple'}`}>{product.condition}</span>
                        <span className="badge badge-purple">{product.size}</span>
                    </div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f5f0ff', marginBottom: 8, fontFamily: 'Inter, sans-serif', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.name}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b5a8a', marginBottom: 14, textTransform: 'capitalize' }}>
                        {product.category.replace('-', ' ')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#d4af37' }}>KES {product.price.toLocaleString()}</span>
                            {product.originalPrice && (
                                <span style={{ fontSize: '0.8rem', color: '#6b5a8a', textDecoration: 'line-through', marginLeft: 8 }}>KES {product.originalPrice.toLocaleString()}</span>
                            )}
                        </div>
                        <button onClick={handleAddToCart} disabled={product.stock === 0}
                            style={{
                                width: 36, height: 36, borderRadius: 8,
                                background: product.stock === 0 ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #d4af37, #f0d060)',
                                border: 'none', cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}>
                            <ShoppingBag size={16} color="#0a0012" />
                        </button>
                    </div>
                    {product.stock > 0 && product.stock <= 5 && (
                        <p style={{ fontSize: '0.75rem', color: '#fb923c', marginTop: 8 }}>⚡ Only {product.stock} left</p>
                    )}
                </div>
            </div>
        </Link>
    );
}
