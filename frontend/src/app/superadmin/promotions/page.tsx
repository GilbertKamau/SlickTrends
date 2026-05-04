'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Megaphone, Calendar, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PromotionsPage() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        imageUrl: '',
        link: '',
        type: 'holiday',
        isActive: true
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        try {
            const r = await api.get('/promotions');
            setPromotions(r.data.promotions);
        } catch (err) {
            toast.error('Failed to fetch promotions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/promotions', formData);
            toast.success('Promotion created!');
            setIsCreating(false);
            setFormData({ title: '', subtitle: '', imageUrl: '', link: '', type: 'holiday', isActive: true });
            fetchPromotions();
        } catch (err) {
            toast.error('Failed to create promotion');
        }
    };

    const handleToggle = async (id: string, isActive: boolean) => {
        try {
            await api.put(`/promotions/${id}`, { isActive: !isActive });
            toast.success('Status updated!');
            fetchPromotions();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this promotion?')) return;
        try {
            await api.delete(`/promotions/${id}`);
            toast.success('Promotion deleted');
            fetchPromotions();
        } catch (err) {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="admin-main">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Internal <span className="gradient-text">Ads & Promotions</span></h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Manage banners and special deals on the home page</p>
                </div>
                <button 
                    onClick={() => setIsCreating(!isCreating)} 
                    className="btn-primary" 
                    style={{ background: isCreating ? 'var(--text-muted)' : 'var(--gradient-gold)' }}
                >
                    {isCreating ? <X size={18} /> : <Plus size={18} />} {isCreating ? 'Cancel' : 'New Promotion'}
                </button>
            </div>

            {isCreating && (
                <div className="glass-card" style={{ padding: 24, marginBottom: 32, maxWidth: 600 }}>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <label className="input-label">Title (e.g. Back to School)</label>
                            <input 
                                className="input-field" 
                                value={formData.title} 
                                onChange={e => setFormData({...formData, title: e.target.value})} 
                                required 
                            />
                        </div>
                        <div>
                            <label className="input-label">Subtitle (e.g. 20% off all kids robes)</label>
                            <input 
                                className="input-field" 
                                value={formData.subtitle} 
                                onChange={e => setFormData({...formData, subtitle: e.target.value})} 
                            />
                        </div>
                        <div>
                            <label className="input-label">Image URL</label>
                            <input 
                                className="input-field" 
                                value={formData.imageUrl} 
                                onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                                required 
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label className="input-label">Link</label>
                                <input 
                                    className="input-field" 
                                    value={formData.link} 
                                    onChange={e => setFormData({...formData, link: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className="input-label">Type</label>
                                <select 
                                    className="input-field" 
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                                >
                                    <option value="holiday">Holiday</option>
                                    <option value="seasonal">Seasonal</option>
                                    <option value="flash">Flash Deal</option>
                                </select>
                            </div>
                        </div>
                        {formData.imageUrl && (
                            <div style={{ marginTop: 8 }}>
                                <label className="input-label">Preview</label>
                                <div className="glass-card" style={{ height: 150, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                                    <div style={{ position: 'absolute', bottom: 12, left: 12, color: '#fff' }}>
                                        <div style={{ fontSize: '1rem', fontWeight: 600 }}>{formData.title || 'Ad Title'}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{formData.subtitle || 'Ad Subtitle'}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button type="submit" className="btn-primary">Save Promotion</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200 }} />)
                ) : promotions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No promotions found. Create your first one!</p>
                ) : (
                    promotions.map((promo: any) => (
                        <div key={promo.id || promo._id} className="glass-card" style={{ overflow: 'hidden', opacity: promo.isActive ? 1 : 0.6 }}>
                            <div style={{ height: 120, position: 'relative' }}>
                                <img src={promo.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                    <button 
                                        onClick={() => handleToggle(promo.id || promo._id, promo.isActive)}
                                        style={{ 
                                            background: promo.isActive ? 'var(--accent-gold)' : 'var(--text-muted)', 
                                            border: 'none', borderRadius: 20, padding: '4px 12px', color: '#000', 
                                            fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' 
                                        }}
                                    >
                                        {promo.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: 20 }}>
                                <h3 style={{ fontSize: '1.2rem', marginBottom: 4 }}>{promo.title}</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>{promo.subtitle}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Megaphone size={14} /> {promo.type}
                                    </span>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button onClick={() => handleDelete(promo.id || promo._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
