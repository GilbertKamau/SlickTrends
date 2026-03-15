'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthCallback() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { setToken, fetchMe } = useAuthStore();

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            const handleAuth = async () => {
                try {
                    setToken(token);
                    await fetchMe();
                    toast.success('Successfully logged in!');
                    
                    const user = useAuthStore.getState().user;
                    if (user?.role === 'superadmin') router.push('/superadmin');
                    else if (user?.role === 'admin') router.push('/admin');
                    else router.push('/');
                } catch (err) {
                    console.error('OAuth callback error:', err);
                    toast.error('Authentication failed. Please try again.');
                    router.push('/auth/login');
                }
            };
            handleAuth();
        } else {
            router.push('/auth/login');
        }
    }, [searchParams, setToken, fetchMe, router]);

    return (
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
            <Loader2 size={40} className="animate-spin" style={{ color: '#d4af37' }} />
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem' }}>Completing login...</h2>
            <p style={{ color: '#6b5a8a' }}>Please wait while we finalize your session.</p>
        </div>
    );
}
