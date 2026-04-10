import axios from 'axios';

let baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

if (process.env.NEXT_PUBLIC_API_URL) {
    if (!baseURL.startsWith('http')) {
        baseURL = `https://${baseURL}`;
    }
    // Ensure it ends with /api (unless they specifically included it)
    if (!baseURL.endsWith('/api')) {
        baseURL = `${baseURL.replace(/\/$/, '')}/api`;
    }
}

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('slick_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 globally
api.interceptors.response.use(
    (res) => res,
    (err: any) => {
        if (err.response?.status === 500) {
            console.error('🔥 BACKEND 500 ERROR:', err.response.data);
            console.dir(err.response.data, { depth: null });
        }
        if (err.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('slick_token');
            localStorage.removeItem('slick_user');
            window.location.href = '/auth/login';
        }
        return Promise.reject(err);
    }
);

export default api;
