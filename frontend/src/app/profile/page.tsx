'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { User, Mail, Phone, MapPin, Save, Lock, Star, Camera } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
    const { user, setUser, token } = useAuthStore();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        address: {
            street: user?.address?.street || '',
            city: user?.address?.city || '',
            postalCode: user?.address?.postalCode || '',
        }
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (!token) router.push('/auth/login');
    }, [token, router]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await api.put('/auth/profile', formData);
            setUser(res.data.user);
            toast.success('Profile updated successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }
        setIsPasswordLoading(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success('Password changed successfully');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="container" style={{ padding: '40px 24px', maxWidth: 1000 }}>
            {/* Header */}
            <div style={{ marginBottom: 40 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.5rem', marginBottom: 8 }}>My <span className="gradient-text">Profile</span></h1>
                <p style={{ color: '#6b5a8a' }}>Manage your account settings and preferences</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32 }} className="profile-grid">
                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
                        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 20px' }}>
                            <div style={{ 
                                width: '100%', height: '100%', borderRadius: '50%', 
                                background: 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(212,175,55,0.2))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid rgba(212,175,55,0.3)', overflow: 'hidden'
                            }}>
                                {user.avatar ? (
                                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={48} color="#d4af37" />
                                )}
                            </div>
                            <button style={{ 
                                position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, 
                                borderRadius: '50%', background: '#d4af37', border: 'none', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}>
                                <Camera size={18} color="#0a0012" />
                            </button>
                        </div>
                        <h3 style={{ color: '#f5f0ff', marginBottom: 4 }}>{user.name}</h3>
                        <p style={{ color: '#6b5a8a', fontSize: '0.875rem', textTransform: 'capitalize' }}>{user.role}</p>
                    </div>

                    <div className="glass-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, color: '#b8a9d0' }}>
                            <Star size={18} color="#d4af37" />
                            <span style={{ fontSize: '0.9rem' }}>Member since {new Date().getFullYear()}</span>
                        </div>
                        {/* More stats could go here */}
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Personal Info */}
                    <div className="glass-card" style={{ padding: 32 }}>
                        <h4 style={{ color: '#d4af37', fontSize: '1.2rem', marginBottom: 24, borderBottom: '1px solid rgba(124,58,237,0.1)', paddingBottom: 12 }}>Personal Information</h4>
                        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ paddingLeft: 44 }} />
                                        <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a' }} />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Phone Number</label>
                                    <div style={{ position: 'relative' }}>
                                        <input className="input-field" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ paddingLeft: 44 }} />
                                        <Phone size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a' }} />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="input-label">Shipping Street Address</label>
                                <div style={{ position: 'relative' }}>
                                    <input className="input-field" value={formData.address.street} onChange={e => setFormData({...formData, address: {...formData.address, street: e.target.value}})} style={{ paddingLeft: 44 }} />
                                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label className="input-label">City</label>
                                    <input className="input-field" value={formData.address.city} onChange={e => setFormData({...formData, address: {...formData.address, city: e.target.value}})} />
                                </div>
                                <div>
                                    <label className="input-label">Postal Code</label>
                                    <input className="input-field" value={formData.address.postalCode} onChange={e => setFormData({...formData, address: {...formData.address, postalCode: e.target.value}})} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                <button className="btn-primary" type="submit" disabled={isLoading} style={{ minWidth: 160, justifyContent: 'center' }}>
                                    <Save size={18} style={{ marginRight: 8 }} /> {isLoading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Change */}
                    <div className="glass-card" style={{ padding: 32 }}>
                        <h4 style={{ color: '#d4af37', fontSize: '1.2rem', marginBottom: 24, borderBottom: '1px solid rgba(124,58,237,0.1)', paddingBottom: 12 }}>Security</h4>
                        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                                <label className="input-label">Current Password</label>
                                <input className="input-field" type="password" value={passwordData.currentPassword} onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} required />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div>
                                    <label className="input-label">New Password</label>
                                    <input className="input-field" type="password" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} required />
                                </div>
                                <div>
                                    <label className="input-label">Confirm New Password</label>
                                    <input className="input-field" type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                <button className="btn-primary" type="submit" disabled={isPasswordLoading} style={{ minWidth: 180, justifyContent: 'center', background: 'transparent', border: '1px solid #d4af37', color: '#d4af37' }}>
                                    <Lock size={18} style={{ marginRight: 8 }} /> {isPasswordLoading ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .profile-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
