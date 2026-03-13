'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Package, ArrowLeft, Save } from 'lucide-react';
import { AdminSidebar } from '../page';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', category: 'robes', size: 'M', condition: 'good', price: '', originalPrice: '', stock: '', brand: '', color: '', material: '', isFeatured: false, images: [''] };
const CATEGORIES = ['robes', 'onesies', 'pajamas', 'night-dresses', 'baby-onesies', 'pre-teen-robes', 'baby-robes'];
const CONDITIONS = ['excellent', 'good', 'fair'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '0-3M', '3-6M', '6-12M', '12-18M', '2T', '3T', '4T', '5T', '6-8Y', '9-12Y'];

export default function AdminStockPage() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    useEffect(() => { if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) router.push('/auth/login'); }, [user, router]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/products/admin/all'); setProducts(r.data.products); } catch { /* silent */ } finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleEdit = (p: typeof form & { _id: string }) => {
        setEditId(p._id);
        setForm({ name: p.name, description: p.description, category: p.category, size: p.size, condition: p.condition, price: String(p.price), originalPrice: String(p.originalPrice || ''), stock: String(p.stock), brand: p.brand || '', color: p.color || '', material: p.material || '', isFeatured: p.isFeatured, images: p.images?.length ? p.images : [''] });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...form, price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined, stock: Number(form.stock) };
            if (editId) { await api.put(`/products/${editId}`, payload); toast.success('Product updated!'); }
            else { await api.post('/products', payload); toast.success('Product added!'); }
            setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchProducts();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Remove this product?')) return;
        try { await api.delete(`/products/${id}`); toast.success('Product removed'); fetchProducts(); } catch { toast.error('Failed to remove'); }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar active="/admin/stock" />
            <main className="admin-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div><h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>Stock Management</h1><p style={{ color: '#6b5a8a', marginTop: 4 }}>{products.length} products in inventory</p></div>
                    <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}>
                        <Plus size={16} /> {showForm ? 'Cancel' : 'Add Product'}
                    </button>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: 24 }}>{editId ? 'Edit Product' : 'Add New Product'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">Product Name *</label>
                                    <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Cozy Winter Robe" />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">Description *</label>
                                    <textarea className="input-field" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3} placeholder="Describe the item, its features..." style={{ resize: 'vertical' }} />
                                </div>
                                <div>
                                    <label className="input-label">Category *</label>
                                    <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Size *</label>
                                    <select className="input-field" value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                                        {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Condition *</label>
                                    <select className="input-field" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                                        {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="input-label">Price (KES) *</label>
                                    <input className="input-field" type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required placeholder="1500" />
                                </div>
                                <div>
                                    <label className="input-label">Original Price (KES)</label>
                                    <input className="input-field" type="number" min="0" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="3000" />
                                </div>
                                <div>
                                    <label className="input-label">Stock Quantity *</label>
                                    <input className="input-field" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required placeholder="10" />
                                </div>
                                <div>
                                    <label className="input-label">Brand</label>
                                    <input className="input-field" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Nike" />
                                </div>
                                <div>
                                    <label className="input-label">Color</label>
                                    <input className="input-field" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="e.g. Navy Blue" />
                                </div>
                                <div>
                                    <label className="input-label">Product Image</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="input-field"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            const toastId = toast.loading('Uploading image...');
                                            try {
                                                const formData = new FormData();
                                                formData.append('image', file);
                                                const res = await api.post('/upload', formData, {
                                                    headers: { 'Content-Type': 'multipart/form-data' }
                                                });
                                                setForm(f => ({ ...f, images: [res.data.url] }));
                                                toast.success('Image uploaded!', { id: toastId });
                                            } catch (err) {
                                                toast.error('Upload failed. Check size/format.', { id: toastId });
                                                console.error(err);
                                            }
                                        }}
                                    />
                                    {form.images[0] && (
                                        <div style={{ marginTop: 8, fontSize: '0.8rem', color: '#10b981' }}>
                                            ✓ Image ready ({form.images[0].substring(0, 30)}...)
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                                    <label htmlFor="featured" style={{ color: '#b8a9d0', cursor: 'pointer' }}>Featured product</label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
                                    <Save size={15} /> {saving ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}
                                </button>
                                <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Products Table */}
                {loading ? <div className="spinner" /> : (
                    <div className="glass-card" style={{ padding: 8 }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
                                        {['Product', 'Category', 'Size', 'Condition', 'Price', 'Stock', 'Status', 'Actions'].map(h => (
                                            <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6b5a8a', fontWeight: 500 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {products.map((p: any) => (
                                        <tr key={p._id} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ fontWeight: 600, color: '#f5f0ff', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                                                {p.isFeatured && <span className="badge badge-gold" style={{ fontSize: '0.65rem', marginTop: 4 }}>Featured</span>}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#b8a9d0', textTransform: 'capitalize' }}>{p.category?.replace('-', ' ')}</td>
                                            <td style={{ padding: '12px 16px' }}><span className="badge badge-purple">{p.size}</span></td>
                                            <td style={{ padding: '12px 16px', color: p.condition === 'excellent' ? '#10b981' : p.condition === 'good' ? '#60a5fa' : '#fb923c', textTransform: 'capitalize' }}>{p.condition}</td>
                                            <td style={{ padding: '12px 16px', color: '#d4af37', fontWeight: 600 }}>KES {Number(p.price).toLocaleString()}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ color: p.stock === 0 ? '#ef4444' : p.stock <= 5 ? '#fb923c' : '#10b981', fontWeight: 700 }}>{p.stock}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span className={`badge ${p.isActive ? 'badge-green' : 'badge-red'}`}>{p.isActive ? 'Active' : 'Hidden'}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={() => handleEdit(p)} style={{ background: 'rgba(124,58,237,0.2)', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#a855f7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}><Edit3 size={12} /> Edit</button>
                                                    <button onClick={() => handleDelete(p._id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}><Trash2 size={12} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {products.length === 0 && <p style={{ textAlign: 'center', color: '#6b5a8a', padding: '40px 0' }}>No products yet. Add your first product!</p>}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
