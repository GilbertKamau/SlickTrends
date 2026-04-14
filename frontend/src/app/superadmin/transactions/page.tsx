'use client';
import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, Loader2, ArrowUpRight } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Transaction {
    id: string;
    order_id: string;
    user_name: string;
    user_email: string;
    amount: string;
    currency: string;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/superadmin/transactions');
            setTransactions(res.data.transactions);
        } catch {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Loader2 className="animate-spin" style={{ color: '#d4af37' }} /></div>;

    return (
        <div>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.8rem' }}>
                    <span className="gradient-text">Financial</span> History
                </h1>
                <p style={{ color: '#6b5a8a', marginTop: 4 }}>All platform transactions and payments</p>
            </div>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(212,175,55,0.05)', borderBottom: '1px solid rgba(212,175,55,0.1)' }}>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Transaction ID</th>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Customer</th>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Method</th>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Amount</th>
                            <th style={{ textAlign: 'left', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Status</th>
                            <th style={{ textAlign: 'right', padding: '16px 20px', fontSize: '0.8rem', color: '#6b5a8a', textTransform: 'uppercase' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontFamily: 'monospace', color: '#f5f0ff', fontSize: '0.85rem' }}>#{tx.id.slice(0, 8)}...</div>
                                    <div style={{ fontSize: '0.7rem', color: '#6b5a8a' }}>Order: #{tx.order_id.slice(0, 8)}</div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{tx.user_name || 'Guest'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#6b5a8a' }}>{tx.user_email}</div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: '#b8a9d0', textTransform: 'capitalize' }}>
                                        {tx.payment_method === 'mpesa' ? '📱 M-Pesa' : tx.payment_method === 'paypal' ? '💳 PayPal' : '🏦 Other'}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#d4af37' }}>
                                        {tx.currency} {parseFloat(tx.amount).toLocaleString()}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: tx.status === 'completed' ? '#10b981' : tx.status === 'pending' ? '#fb923c' : '#ef4444' }}>
                                        {tx.status === 'completed' ? <CheckCircle size={14} /> : tx.status === 'pending' ? <Clock size={14} /> : <XCircle size={14} />}
                                        {tx.status.toUpperCase()}
                                    </div>
                                </td>
                                <td style={{ padding: '16px 20px', textAlign: 'right', fontSize: '0.85rem', color: '#6b5a8a' }}>
                                    {new Date(tx.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {transactions.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(212,175,55,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <DollarSign size={30} color="#6b5a8a" />
                    </div>
                    <p style={{ color: '#6b5a8a' }}>No transactions recorded yet.</p>
                </div>
            )}
        </div>
    );
}
