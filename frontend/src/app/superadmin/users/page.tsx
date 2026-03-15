'use client';
import { useState, useEffect } from 'react';
import { Mail, Shield, UserX, Loader2, Search } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await api.get('/superadmin/users');
            setUsers(res.data.users);
        } catch {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/superadmin/users/${id}/status`, { isActive: !currentStatus });
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
            setUsers(users.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
        } catch {
            toast.error('Operation failed');
        }
    };

    const filtered = users.filter(u => 
        (u.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
        (u.email?.toLowerCase() || '').includes(search.toLowerCase())
    );

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Loader2 className="animate-spin" style={{ color: '#d4af37' }} /></div>;

    return (
        <div>
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>
                        <span className="gradient-text">Registered</span> Users
                    </h1>
                    <p style={{ color: '#6b5a8a', marginTop: 4 }}>Manage platform customers and staff</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '10px 16px 10px 40px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 10, color: '#f5f0ff', fontSize: '0.9rem', width: 260 }}
                    />
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#6b5a8a' }} />
                </div>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>User</th>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Role</th>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Joined</th>
                            <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(user => (
                            <tr key={user._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} className="hover-row">
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b5a8a', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Mail size={12} /> {user.email}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: 6, background: user.role === 'customer' ? 'rgba(96,165,250,0.1)' : 'rgba(212,175,55,0.1)', color: user.role === 'customer' ? '#60a5fa' : '#d4af37', fontWeight: 600, border: `1px solid ${user.role === 'customer' ? 'rgba(96,165,250,0.2)' : 'rgba(212,175,55,0.2)'}` }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: user.isActive ? '#10b981' : '#ef4444' }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
                                        {user.isActive ? 'Active' : 'Banned'}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: '#6b5a8a' }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                    <button 
                                        onClick={() => toggleStatus(user._id, user.isActive)}
                                        style={{ background: 'none', border: 'none', color: user.isActive ? '#ef4444' : '#10b981', cursor: 'pointer', padding: 8, transition: 'all 0.2s' }}
                                        title={user.isActive ? 'Deactivate User' : 'Activate User'}
                                    >
                                        {user.isActive ? <UserX size={18} /> : <Shield size={18} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#6b5a8a' }}>
                    No users found matching your search.
                </div>
            )}
        </div>
    );
}
