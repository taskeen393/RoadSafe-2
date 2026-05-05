/**
 * Centralized API Client
 * 
 * Single axios instance with:
 * - Base URL configuration (auto-switches: Expo Go = local IP, APK = Railway)
 * - Auth token interceptor (auto-injects Bearer token)
 * - Error handling interceptor
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// ✅ Smart URL: Expo Go pe local IP, APK pe deployed backend
// Expo Go mein __DEV__ = true aur EXPO_PUBLIC_API_URL set hota hai
// APK mein EXPO_PUBLIC_API_URL environment se nahi milta (build time pe bake hota hai)
const DEPLOYED_BACKEND_URL = 'https://amt-backend-production.up.railway.app/api';
const LOCAL_BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.2.104:5000/api';

// __DEV__ = true means running in Expo Go / dev mode
// __DEV__ = false means running as standalone APK
export const API_BASE_URL = __DEV__ ? LOCAL_BACKEND_URL : DEPLOYED_BACKEND_URL;

// Log API base URL in development to help debug connection issues
if (__DEV__) {
    console.log('🔗 API Base URL (Expo Go mode):', API_BASE_URL);
} else {
    console.log('📦 API Base URL (APK mode):', API_BASE_URL);
}

// External API keys — read from environment (set in .env)
export const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY ?? '';
export const OPENWEATHER_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_KEY ?? '';
export const LOCATIONIQ_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY ?? '';

// Create axios instance for backend API
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // Increased timeout for file uploads (60 seconds)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Auto-inject auth token
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            const token = await SecureStore.getItemAsync('token');
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            // If data is FormData, remove Content-Type header to let axios set it with boundary
            // React Native FormData needs special handling
            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
                // Ensure axios knows this is FormData for React Native
                if (__DEV__) {
                    // React Native FormData has _parts property (not in standard FormData type)
                    const formData = config.data as any;
                    const hasFiles = formData._parts ? formData._parts.length : 0;
                    console.log('📤 Sending FormData request:', {
                        url: config.url,
                        hasFiles,
                    });
                }
            }
        } catch (error) {
            console.log('Error getting token:', error);
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (__DEV__) {
            const status = error.response?.status;
            // 400 errors (e.g. wrong password) — log nahi karo, user ko UI mein dikhao
            if (!error.response) {
                console.warn('⚠️ Network Error: Backend se connection nahi. Check karein server chal raha hai.');
            } else if (status && status >= 500) {
                // Sirf serious server errors log karo
                console.error('❌ Server Error:', {
                    url: error.config?.url,
                    status,
                    data: error.response?.data,
                });
            }
        }

        // Handle specific error codes
        if (error.response?.status === 401) {
            const msg = (error.response?.data as any)?.msg || 'Unauthorized';
            console.log(`❌ 401 Unauthorized: ${msg}`);
            
            // Clear token and redirect to login
            SecureStore.deleteItemAsync('token')
                .catch(e => console.log('⚠️ SecureStore delete error:', e.message))
                .finally(() => {
                    try {
                        const { router } = require('expo-router');
                        if (router) router.replace('/auth/login');
                    } catch (e) {
                        console.log('🚪 Navigation to login failed');
                    }
                });
        }

        return Promise.reject(error);
    }
);

// Create axios instance for external APIs (no auth needed)
export const externalApiClient = axios.create({
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
