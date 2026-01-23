/**
 * Centralized API Client
 * 
 * Single axios instance with:
 * - Base URL configuration
 * - Auth token interceptor (auto-injects Bearer token)
 * - Error handling interceptor
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Base URL for backend API
export const API_BASE_URL = 'http://192.168.2.104:5000/api';

// External API keys
export const GOOGLE_API_KEY = 'AIzaSyA9WotEPNh6PRm_rIR6x_OO7lCyfsF0uoI';
export const OPENWEATHER_KEY = '18a94d9824f517052eae3c6d408213ea';
export const LOCATIONIQ_KEY = 'pk.373eb4eed9c850538051f7b1c58f4457';

// Create axios instance for backend API
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
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
            console.log('API Error:', {
                url: error.config?.url,
                status: error.response?.status,
                data: error.response?.data,
            });
        }

        // Handle specific error codes
        if (error.response?.status === 401) {
            // Token expired or invalid - could trigger logout
            console.log('Unauthorized - Token may be expired');
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
