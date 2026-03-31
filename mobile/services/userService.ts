/**
 * User Service
 * 
 * Handles user profile-related API calls:
 * - Update profile
 * - Get profile
 * - Upload profile picture
 */

import * as SecureStore from 'expo-secure-store';
import apiClient, { API_BASE_URL } from './apiClient';
import { User } from './types';

function guessMimeTypeFromUri(uri: string): string {
    const lower = uri.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
    return 'image/jpeg';
}

/**
 * Update user profile (including profile picture)
 */
export const updateProfile = async (data: {
    name?: string;
    email?: string;
    profileImageUri?: string;
}): Promise<{ user: User; message: string }> => {
    try {
        const formData = new FormData();

        if (data.name) formData.append('name', data.name);
        if (data.email) formData.append('email', data.email);

        // Send profile image as file if provided
        if (data.profileImageUri) {
            // Only send local file URIs (file:// or content://), not remote URLs
            if (data.profileImageUri.startsWith('file://') || data.profileImageUri.startsWith('content://')) {
                const filename = `profile_${Date.now()}.jpg`;
                const mimeType = guessMimeTypeFromUri(data.profileImageUri);
                
                formData.append('profileImage', {
                    uri: data.profileImageUri,
                    type: mimeType,
                    name: filename,
                } as any);
            }
        }

        const token = await SecureStore.getItemAsync('token');
        if (!token) {
            throw { msg: 'Not authenticated. Please login again.' };
        }

        const url = `${API_BASE_URL}/user/profile`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
            throw { msg: errorData.message || errorData.msg || 'Failed to update profile' };
        }

        const result = await response.json();
        
        // Update stored user data
        if (result.user) {
            await SecureStore.setItemAsync('user', JSON.stringify(result.user));
        }
        
        return result;
    } catch (error: any) {
        console.log('Update profile error:', error);
        
        if (error.message && (error.message.includes('Network') || error.message.includes('fetch'))) {
            throw { 
                msg: 'Network error: Cannot connect to server. Please check your internet connection and ensure the backend is running.',
                code: error.code,
            };
        }
        
        if (error.msg) {
            throw error;
        }
        
        throw { msg: 'Failed to update profile' };
    }
};

/**
 * Get current user profile
 */
export const getProfile = async (): Promise<{ user: User }> => {
    try {
        const response = await apiClient.get<{ user: User }>('/user/profile');
        
        // Update stored user data
        if (response.data.user) {
            await SecureStore.setItemAsync('user', JSON.stringify(response.data.user));
        }
        
        return response.data;
    } catch (error: any) {
        console.log('Get profile error:', error.response?.data || error.message);
        throw error.response?.data || { msg: 'Failed to fetch profile' };
    }
};
