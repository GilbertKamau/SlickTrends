import axios from 'axios';
import Constants from 'expo-constants';

// For physical device testing, use your machine's local IP
// The default port for the backend is 5000
const BASE_URL = 'http://192.168.88.234:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
