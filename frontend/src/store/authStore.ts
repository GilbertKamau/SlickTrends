import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'customer' | 'admin' | 'superadmin';
    phone?: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: false,
            login: async (email, password) => {
                set({ isLoading: true });
                try {
                    const res = await api.post('/auth/login', { email, password });
                    const { token, user } = res.data;
                    localStorage.setItem('slick_token', token);
                    set({ user, token, isLoading: false });
                } catch (err) {
                    set({ isLoading: false });
                    throw err;
                }
            },
            register: async (data) => {
                set({ isLoading: true });
                try {
                    const res = await api.post('/auth/register', data);
                    const { token, user } = res.data;
                    localStorage.setItem('slick_token', token);
                    set({ user, token, isLoading: false });
                } catch (err) {
                    set({ isLoading: false });
                    throw err;
                }
            },
            logout: () => {
                localStorage.removeItem('slick_token');
                set({ user: null, token: null });
            },
            setUser: (user) => set({ user }),
        }),
        { name: 'slick_auth', partialize: (state) => ({ user: state.user, token: state.token }) }
    )
);
