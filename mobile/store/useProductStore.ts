import { create } from 'zustand';
import api from '../lib/api';

interface ProductState {
    products: any[];
    loading: boolean;
    error: string | null;
    fetchProducts: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
    products: [],
    loading: false,
    error: null,
    fetchProducts: async () => {
        set({ loading: true, error: null });
        try {
            console.log('Fetching products from:', api.defaults.baseURL + '/products');
            const response = await api.get('/products');
            console.log('Products received:', response.data.products?.length || 0);
            set({ products: response.data.products || [], loading: false });
        } catch (err: any) {
            console.error('Fetch error:', err.message);
            if (err.response) {
                console.error('Server responded with:', err.response.status, err.response.data);
            }
            set({ error: err.message, loading: false });
        }
    },
}));
