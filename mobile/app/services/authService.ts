/**
 * Auth Service
 * 
 * Handles all authentication-related API calls:
 * - Login
 * - Signup
 * - Logout
 * - Token/User management
 */

import * as SecureStore from 'expo-secure-store';
import apiClient from './apiClient';
import { AuthResponse, LoginRequest, SignupRequest, User } from './types';

/**
 * Login user with email and password
 */
export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { msg: 'Login failed' };
    }
};

/**
 * Register new user
 */
export const signup = async (data: SignupRequest): Promise<AuthResponse> => {
    try {
        const response = await apiClient.post<AuthResponse>('/auth/signup', data);
        return response.data;
    } catch (error: any) {
        throw error.response?.data || { msg: 'Signup failed' };
    }
};

/**
 * Logout user - clears stored credentials
 */
export const logout = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync('profileImage');
    } catch (error) {
        console.log('Error during logout:', error);
    }
};

/**
 * Get stored auth token
 */
export const getToken = async (): Promise<string | null> => {
    try {
        return await SecureStore.getItemAsync('token');
    } catch (error) {
        return null;
    }
};

/**
 * Get current logged-in user
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const userStr = await SecureStore.getItemAsync('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * Save auth credentials to secure storage
 */
export const saveAuthCredentials = async (token: string, user: User): Promise<void> => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    const token = await getToken();
    return token !== null;
};
