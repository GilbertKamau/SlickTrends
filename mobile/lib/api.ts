import axios from 'axios';

// Production API URL — switch to local IP for development testing
const BASE_URL = __DEV__
    ? 'http://192.168.88.234:5000/api'   // Local dev (use your machine's IP)
    : 'https://slicktrends-backend-production.up.railway.app/api'; // Production

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
