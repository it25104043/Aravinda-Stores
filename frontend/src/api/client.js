import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    timeout: 10000
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        const errorMessage = error.response?.data?.message || 'Network error occurred. Please try again.';
        console.error('API Error:', errorMessage);
        return Promise.reject(error);
    }
);

export default apiClient;