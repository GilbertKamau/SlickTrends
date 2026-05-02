'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import api from '@/lib/api';

const CATEGORIES = [
    { value: '', label: 'All Categories' },
    { value: 'robes', label: 'Robes' },
    { value: 'onesies', label: 'Onesies' },
    { value: 'pajamas', label: 'Pajamas' },
    { value: 'night-dresses', label: 'Night Dresses' },
    { value: 'baby-onesies', label: 'Baby Onesies' },
    { value: 'pre-teen-robes', label: 'Pre-Teen Robes' },
    { value: 'baby-robes', label: 'Baby Robes' },
];

const CONDITIONS = [
    { value: '', label: 'Any Condition' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
];

const SIZES = ['', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '0-3M', '3-6M', '6-12M', '12-18M', '2T', '3T', '4T', '5T', '6-8Y', '9-12Y'];

function ProductsContent() {
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [hasMounted, setHasMounted] = useState(false);
    const [filters, setFilters] = useState({
        category: searchParams.get('category') || '',
        condition: '',
        size: '',
        minPrice: '',
        maxPrice: '',
        search: searchParams.get('search') || '',
    });

    const fetchProducts = async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.category) params.set('category', filters.category);
            if (filters.condition) params.set('condition', filters.condition);
            if (filters.size) params.set('size', filters.size);
            if (filters.minPrice) params.set('minPrice', filters.minPrice);
            if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
            if (filters.search) params.set('search', filters.search);
            params.set('page', String(p));
            params.set('limit', '12');
            const res = await api.get(`/products?${params}`);
            setProducts(res.data.products);
            setTotal(res.data.total);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    useEffect(() => { setHasMounted(true); }, []);
    useEffect(() => { fetchProducts(1); setPage(1); }, [filters]);

    const FilterContent = () => (
        <div className="glass-card" style={{ padding: 24, position: 'sticky', top: 90 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' }}>Filters</h3>
                {Object.values(filters).some(Boolean) && (
                    <button onClick={() => setFilters({ category: '', condition: '', size: '', minPrice: '', maxPrice: '', search: '' })}
                        style={{ background: 'none', border: 'none', color: '#6b5a8a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                        <X size={12} /> Clear
                    </button>
                )}
            </div>

            <div style={{ marginBottom: 24 }}>
                <label className="input-label">Category</label>
                {CATEGORIES.map((c) => (
                    <button key={c.value} onClick={() => setFilters(f => ({ ...f, category: c.value }))}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 4, fontSize: '0.875rem', background: filters.category === c.value ? 'rgba(212,175,55,0.15)' : 'transparent', color: filters.category === c.value ? '#d4af37' : '#b8a9d0', transition: 'all 0.2s' }}>
                        {c.label}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: 24 }}>
                <label className="input-label">Condition</label>
                {CONDITIONS.map((c) => (
                    <button key={c.value} onClick={() => setFilters(f => ({ ...f, condition: c.value }))}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: 4, fontSize: '0.875rem', background: filters.condition === c.value ? 'rgba(212,175,55,0.15)' : 'transparent', color: filters.condition === c.value ? '#d4af37' : '#b8a9d0', transition: 'all 0.2s' }}>
                        {c.label}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: 24 }}>
                <label className="input-label">Size</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {SIZES.map((s) => (
                        <button key={s} onClick={() => setFilters(f => ({ ...f, size: s }))}
                            style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid', fontSize: '0.75rem', cursor: 'pointer', borderColor: filters.size === s ? '#d4af37' : 'rgba(124,58,237,0.3)', background: filters.size === s ? 'rgba(212,175,55,0.15)' : 'transparent', color: filters.size === s ? '#d4af37' : '#b8a9d0' }}>
                            {s || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="input-label">Price Range (KES)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input className="input-field" placeholder="Min" value={filters.minPrice} onChange={(e) => setFilters(f => ({ ...f, minPrice: e.target.value }))} style={{ width: '50%', padding: '8px 12px', fontSize: '0.85rem' }} />
                    <input className="input-field" placeholder="Max" value={filters.maxPrice} onChange={(e) => setFilters(f => ({ ...f, maxPrice: e.target.value }))} style={{ width: '50%', padding: '8px 12px', fontSize: '0.85rem' }} />
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            <main style={{ flex: 1 }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(212,175,55,0.05))', padding: '50px 0 40px', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                    <div className="container">
                        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: 8 }}>
                            {filters.category ? CATEGORIES.find(c => c.value === filters.category)?.label : 'All Products'}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>{total} items available</p>

                        {/* Search */}
                        <div style={{ position: 'relative', maxWidth: 500, marginTop: 24 }}>
                            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a' }} />
                            <input
                                className="input-field"
                                style={{ paddingLeft: 44 }}
                                placeholder="Search products..."
                                value={filters.search}
                                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="container" style={{ display: 'flex', gap: 32, padding: '40px 24px' }}>
                    {/* Sidebar Filters */}
                    {/* Sidebar Filters (Desktop) */}
                    <aside className="desktop-only" style={{ width: 240, flexShrink: 0 }}>
                        <FilterContent />
                    </aside>

                    {/* Mobile Filter Drawer */}
                    <div className={`mobile-drawer-overlay ${showMobileFilters ? 'active' : ''}`} onClick={() => setShowMobileFilters(false)} />
                    <div className={`mobile-drawer ${showMobileFilters ? 'active' : ''}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.2rem' }}>Filters</h3>
                            <button onClick={() => setShowMobileFilters(false)} style={{ background: 'none', border: 'none', color: '#b8a9d0' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <FilterContent />
                        <button 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}
                            onClick={() => setShowMobileFilters(false)}
                        >
                            Show Results
                        </button>
                    </div>

                    {/* Products Grid */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <button onClick={() => setShowMobileFilters(true)} className="mobile-only btn-ghost" style={{ fontSize: '0.875rem' }}>
                                <SlidersHorizontal size={15} /> Filters
                            </button>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{total} products</p>
                        </div>

                        {loading ? (
                            <div className="product-grid">
                                {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 340, borderRadius: 20 }} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '80px 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: 20 }}>🔍</div>
                                <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: 10 }}>No products found</h3>
                                <p style={{ color: '#6b5a8a' }}>Try adjusting your filters</p>
                            </div>
                        ) : (
                            <div className="product-grid">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {products.map((p: any) => <ProductCard key={p.id || p._id} product={p} />)}
                            </div>
                        )}

                        {/* Pagination */}
                        {total > 12 && (
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
                                {[...Array(Math.ceil(total / 12))].map((_, i) => (
                                    <button key={i} onClick={() => { setPage(i + 1); fetchProducts(i + 1); }}
                                        style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, borderColor: page === i + 1 ? '#d4af37' : 'rgba(124,58,237,0.3)', background: page === i + 1 ? 'rgba(212,175,55,0.15)' : 'transparent', color: page === i + 1 ? '#d4af37' : '#b8a9d0' }}>
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div className="spinner" />}>
            <ProductsContent />
        </Suspense>
    );
}
