'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Package, ArrowLeft, Save, X, UploadCloud, FileArchive, CheckCircle } from 'lucide-react';
import { AdminSidebar } from '../page';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import CustomSelect from '@/components/CustomSelect';

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
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkFile, setBulkFile] = useState<File | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ added: number; failed: number; details: { name: string; error: string }[] } | null>(null);

    useEffect(() => { if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) router.push('/auth/login'); }, [user, router]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try { const r = await api.get('/products/admin/all'); setProducts(r.data.products); } catch { /* silent */ } finally { setLoading(false); }
    }, []);
    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleEdit = (p: typeof form & { _id?: string; id?: string }) => {
        setEditId(p.id || p._id || null);
        setForm({ name: p.name, description: p.description, category: p.category, size: p.size, condition: p.condition, price: String(p.price), originalPrice: String(p.originalPrice || ''), stock: String(p.stock), brand: p.brand || '', color: p.color || '', material: p.material || '', isFeatured: p.isFeatured, images: p.images?.length ? p.images : [''] });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 
        
        // Clean images array
        const cleanedImages = form.images.filter(url => url && url.trim() !== '');
        
        if (cleanedImages.length === 0) {
            toast.error('At least one product image is required!');
            return;
        }

        setSaving(true);
        try {
            const payload = { 
                ...form, 
                images: cleanedImages,
                price: Number(form.price), 
                originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined, 
                stock: Number(form.stock) 
            };
            
            if (editId) { 
                await api.put(`/products/${editId}`, payload); 
                toast.success('Product updated!'); 
            } else { 
                await api.post('/products', payload); 
                toast.success('Product added!'); 
            }
            setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchProducts();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed');
        } finally { setSaving(false); }
    };

    const handleBulkZip = async () => {
        if (!bulkFile) { toast.error('Please select a zip file first.'); return; }
        setBulkLoading(true);
        setBulkResult(null);
        try {
            const formData = new FormData();
            formData.append('zipfile', bulkFile);
            const res = await api.post('/products/bulk-zip', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 });
            setBulkResult(res.data);
            toast.success(`✓ Imported ${res.data.added} products successfully!`);
            fetchProducts();
        } catch (err: unknown) {
            toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Bulk import failed');
        } finally { setBulkLoading(false); }
    };

    const handleDelete = async (id: string) => {
        console.log('Attempting to delete product with ID:', id);
        if (!confirm('Remove this product?')) return;
        try { await api.delete(`/products/${id}`); toast.success('Product removed'); fetchProducts(); } catch { toast.error('Failed to remove'); }
    };

    return (
        <div className="admin-layout">
            <AdminSidebar active="/admin/stock" />
            <main className="admin-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div><h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>Stock Management</h1><p style={{ color: '#6b5a8a', marginTop: 4 }}>{products.filter((p: any) => p.is_active !== false).length} products in inventory</p></div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-ghost" onClick={() => { setShowBulkModal(true); setBulkFile(null); setBulkResult(null); }} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(212,175,55,0.4)', color: '#d4af37' }}>
                            <FileArchive size={16} /> Bulk Import ZIP
                        </button>
                        <button className="btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM); }}>
                            <Plus size={16} /> {showForm ? 'Cancel' : 'Add Product'}
                        </button>
                    </div>
                </div>

                {/* Add/Edit Form */}
                {showForm && (
                    <div className="glass-card" style={{ padding: 32, marginBottom: 32 }}>
                        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.3rem', marginBottom: 24 }}>{editId ? 'Edit Product' : 'Add New Product'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">Product Name <span style={{ color: '#ef4444' }}>*</span></label>
                                    <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Cozy Winter Robe" />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label className="input-label">Description <span style={{ color: '#ef4444' }}>*</span></label>
                                    <textarea className="input-field" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required rows={3} placeholder="Describe the item, its features..." style={{ resize: 'vertical' }} />
                                </div>
                                <div>
                                    <CustomSelect 
                                        label="Category" 
                                        required 
                                        options={CATEGORIES} 
                                        value={form.category} 
                                        onChange={(v) => setForm(f => ({ ...f, category: v }))} 
                                    />
                                </div>
                                <div>
                                    <CustomSelect 
                                        label="Size" 
                                        required 
                                        options={SIZES} 
                                        value={form.size} 
                                        onChange={(v) => setForm(f => ({ ...f, size: v }))} 
                                    />
                                </div>
                                <div>
                                    <CustomSelect 
                                        label="Condition" 
                                        required 
                                        options={CONDITIONS} 
                                        value={form.condition} 
                                        onChange={(v) => setForm(f => ({ ...f, condition: v }))} 
                                    />
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
                                    <label className="input-label">Stock Quantity <span style={{ color: '#ef4444' }}>*</span></label>
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
                                    <label className="input-label">Product Images (Upload up to 5)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="input-field"
                                        style={{ marginBottom: 12 }}
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files || []);
                                            if (files.length === 0) return;
                                            
                                            const toastId = toast.loading(`Uploading ${files.length} image(s)...`);
                                            try {
                                                const uploadedUrls: string[] = [];
                                                for (const file of files) {
                                                    const formData = new FormData();
                                                    formData.append('image', file);
                                                    const res = await api.post('/upload', formData, {
                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                    });
                                                    uploadedUrls.push(res.data.url);
                                                }
                                                setForm(f => ({ ...f, images: [...(f.images || []), ...uploadedUrls].filter(url => url !== '') }));
                                                toast.success('Images uploaded!', { id: toastId });
                                            } catch (err) {
                                                toast.error('Upload failed. Check size/format.', { id: toastId });
                                                console.error(err);
                                            }
                                        }}
                                    />
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                        {form.images.filter(url => url !== '').map((url, idx) => (
                                            <div key={idx} style={{ position: 'relative', width: 80, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(124,58,237,0.3)' }}>
                                                <img src={url} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button 
                                                    type="button"
                                                    onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))}
                                                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    {form.images.length === 0 && <p style={{ fontSize: '0.8rem', color: '#6b5a8a', marginTop: 4 }}>No images uploaded yet.</p>}
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
                                    {products.filter((p: any) => p.is_active !== false && p.isActive !== false).map((p: any) => (
                                        <tr key={p.id || p._id} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
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
                                                    <button onClick={() => handleDelete(p.id || p._id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 6, padding: '6px 10px', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}><Trash2 size={12} /></button>
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

            {/* ─── Bulk ZIP Import Modal ─── */}
            {showBulkModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,0,15,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: 520, padding: 40, position: 'relative' }}>
                        <button onClick={() => { setShowBulkModal(false); setBulkResult(null); setBulkFile(null); }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: '#6b5a8a', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: 28 }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <FileArchive size={26} color="#d4af37" />
                            </div>
                            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', marginBottom: 8 }}>Bulk Import Products</h2>
                            <p style={{ color: '#6b5a8a', fontSize: '0.875rem' }}>
                                Drop a <code style={{ background: 'rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: 4, color: '#a855f7' }}>.zip</code> file containing <strong style={{ color: '#b8a9d0' }}>products.json</strong> + your images.
                            </p>
                        </div>

                        {/* Result summary */}
                        {bulkResult && (
                            <div style={{ marginBottom: 24, padding: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                                    <CheckCircle size={20} color="#10b981" />
                                    <span style={{ color: '#10b981', fontWeight: 700 }}>{bulkResult.added} products imported!</span>
                                    {bulkResult.failed > 0 && <span style={{ color: '#fb923c', fontSize: '0.8rem', marginLeft: 'auto' }}>{bulkResult.failed} failed</span>}
                                </div>
                                {bulkResult.details.map((d, i) => (
                                    <p key={i} style={{ color: '#fb923c', fontSize: '0.75rem', marginTop: 4 }}>⚠ {d.name}: {d.error}</p>
                                ))}
                            </div>
                        )}

                        {/* File picker */}
                        <label style={{ display: 'block', border: '2px dashed rgba(212,175,55,0.3)', borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 20, transition: 'border-color 0.2s', background: bulkFile ? 'rgba(212,175,55,0.05)' : 'transparent' }}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith('.zip')) setBulkFile(f); else toast.error('Please drop a .zip file'); }}>
                            <input type="file" accept=".zip" style={{ display: 'none' }} onChange={e => setBulkFile(e.target.files?.[0] || null)} />
                            <UploadCloud size={32} color={bulkFile ? '#d4af37' : '#6b5a8a'} style={{ margin: '0 auto 12px' }} />
                            {bulkFile
                                ? <><p style={{ color: '#d4af37', fontWeight: 600 }}>{bulkFile.name}</p><p style={{ color: '#6b5a8a', fontSize: '0.8rem', marginTop: 4 }}>{(bulkFile.size / 1024 / 1024).toFixed(1)} MB — click to change</p></>
                                : <><p style={{ color: '#b8a9d0' }}>Click or drag &amp; drop your <strong>.zip</strong> file here</p><p style={{ color: '#6b5a8a', fontSize: '0.8rem', marginTop: 6 }}>Max 50 MB</p></>}
                        </label>

                        <div style={{ fontSize: '0.75rem', color: '#6b5a8a', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
                            <strong style={{ color: '#a855f7' }}>ZIP format:</strong> include <code>products.json</code> (array of products) + all image files in the same zip. The <code>images</code> field in each product should list the exact image filenames.
                        </div>

                        <button
                            onClick={handleBulkZip}
                            disabled={!bulkFile || bulkLoading}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', opacity: (!bulkFile || bulkLoading) ? 0.6 : 1 }}>
                            {bulkLoading
                                ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: 8 }} />Importing — please wait, this can take 1-2 min...</>
                                : <><UploadCloud size={16} style={{ marginRight: 8 }} />Import All Products</>}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
