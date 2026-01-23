/**
 * Report Service
 * 
 * Handles all report-related API calls:
 * - Submit new report
 * - Get all reports
 * - Get single report
 */


import * as SecureStore from 'expo-secure-store';
import apiClient, { API_BASE_URL } from './apiClient';
import { ReportRequest, ReportResponse } from './types';

function guessMimeTypeFromUri(uri: string, isVideo: boolean = false): string {
    const lower = uri.toLowerCase();
    
    if (isVideo) {
        if (lower.endsWith('.mp4')) return 'video/mp4';
        if (lower.endsWith('.mov')) return 'video/quicktime';
        if (lower.endsWith('.avi')) return 'video/x-msvideo';
        if (lower.endsWith('.mkv')) return 'video/x-matroska';
        if (lower.endsWith('.webm')) return 'video/webm';
        return 'video/mp4'; // Default for videos
    }
    
    // Image MIME types
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/heic';
    return 'image/jpeg';
}

/**
 * Submit a new incident report
 * Uses fetch instead of axios for FormData - React Native's fetch handles FormData better
 */
export const submitReport = async (data: ReportRequest): Promise<ReportResponse> => {
    try {
        // IMPORTANT: image/video URIs from Expo are local device paths (file://...)
        // They must be sent as multipart/form-data for the backend to upload to Cloudinary.
        const formData = new FormData();

        formData.append('title', data.title);
        formData.append('description', data.description);
        formData.append('location', data.location);
        formData.append('lat', String(data.lat));
        formData.append('lon', String(data.lon));
        formData.append('dateTime', data.dateTime);

        // Send images as files (backend expects "images")
        // React Native FormData requires specific format
        if (data.imageUris && data.imageUris.length > 0) {
            data.imageUris.forEach((uri, idx) => {
                // Only send local file URIs (file:// or content://), not remote URLs
                if (uri.startsWith('file://') || uri.startsWith('content://')) {
                    const filename = `report_image_${Date.now()}_${idx}.jpg`;
                    const mimeType = guessMimeTypeFromUri(uri, false);
                    
                    // React Native FormData format - fetch handles this better than axios
                    formData.append('images', {
                        uri: uri,
                        type: mimeType,
                        name: filename,
                    } as any);
                }
            });
        }

        // Send videos as files (backend expects "videos")
        if (data.videoUris && data.videoUris.length > 0) {
            let videoFilesAdded = 0;
            data.videoUris.forEach((uri, idx) => {
                // Only send local file URIs (file:// or content://), not remote URLs
                if (uri.startsWith('file://') || uri.startsWith('content://')) {
                    const filename = `report_video_${Date.now()}_${idx}.mp4`;
                    const mimeType = guessMimeTypeFromUri(uri, true);
                    
                    // React Native FormData format for videos
                    formData.append('videos', {
                        uri: uri,
                        type: mimeType,
                        name: filename,
                    } as any);
                    videoFilesAdded++;
                    
                    if (__DEV__) {
                        console.log(`📹 Adding video ${idx + 1}:`, { uri, mimeType, filename });
                    }
                } else {
                    if (__DEV__) {
                        console.log(`⚠️ Skipping video ${idx + 1} (not a local file):`, uri);
                    }
                }
            });
            
            if (__DEV__) {
                console.log(`✅ Added ${videoFilesAdded} video(s) to FormData`);
            }
        } else {
            if (__DEV__) {
                console.log('ℹ️ No videos to upload');
            }
        }

        if (__DEV__) {
            console.log('📤 Submitting report with FormData:', {
                title: data.title,
                imageCount: data.imageUris?.length || 0,
                videoCount: data.videoUris?.length || 0,
                imageUris: data.imageUris,
                videoUris: data.videoUris,
                location: data.location,
            });
        }

        // Get auth token
        const token = await SecureStore.getItemAsync('token');
        if (!token) {
            throw { msg: 'Not authenticated. Please login again.' };
        }

        // Use fetch for FormData - React Native's fetch handles FormData natively better than axios
        const url = `${API_BASE_URL}/report`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Don't set Content-Type - fetch will set it automatically with boundary for FormData
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to submit report' }));
            throw { msg: errorData.message || errorData.msg || 'Failed to submit report' };
        }

        const result: ReportResponse = await response.json();
        
        if (__DEV__) {
            console.log('✅ Report submitted successfully');
        }
        
        return result;
    } catch (error: any) {
        console.log('Submit report error:', error);
        
        // Handle network errors
        if (error.message && (error.message.includes('Network') || error.message.includes('fetch'))) {
            throw { 
                msg: 'Network error: Cannot connect to server. Please check your internet connection and ensure the backend is running.',
                code: error.code,
            };
        }
        
        // Return error as-is if it already has msg property
        if (error.msg) {
            throw error;
        }
        
        throw { msg: 'Failed to submit report' };
    }
};

/**
 * Get all reports
 */
export const getReports = async (): Promise<ReportResponse[]> => {
    try {
        const response = await apiClient.get<ReportResponse[]>('/report');
        return response.data;
    } catch (error: any) {
        console.log('Get reports error:', error.response?.data || error.message);
        throw error.response?.data || { msg: 'Failed to fetch reports' };
    }
};

/**
 * Get a single report by ID
 */
export const getReportById = async (id: string): Promise<ReportResponse> => {
    try {
        const response = await apiClient.get<ReportResponse>(`/report/${id}`);
        return response.data;
    } catch (error: any) {
        console.log('Get report error:', error.response?.data || error.message);
        throw error.response?.data || { msg: 'Failed to fetch report' };
    }
};

/**
 * Update a report
 */
export const updateReport = async (id: string, data: Partial<ReportRequest>): Promise<ReportResponse> => {
    try {
        const formData = new FormData();

        if (data.title) formData.append('title', data.title);
        if (data.description !== undefined) formData.append('description', data.description);
        if (data.location !== undefined) formData.append('location', data.location);
        if (data.lat !== undefined) formData.append('lat', String(data.lat));
        if (data.lon !== undefined) formData.append('lon', String(data.lon));
        
        // Separate new file uploads from existing image URLs
        const newImageFiles: string[] = [];
        const existingImageUrls: string[] = [];
        
        if (data.imageUris && data.imageUris.length > 0) {
            data.imageUris.forEach((uri) => {
                if (uri.startsWith('file://') || uri.startsWith('content://')) {
                    // New file upload
                    newImageFiles.push(uri);
                } else {
                    // Existing URL (from Cloudinary or other source)
                    existingImageUrls.push(uri);
                }
            });
        }

        // Send existing image URLs as JSON string (backend will use these if no new files)
        if (existingImageUrls.length > 0) {
            formData.append('imageUris', JSON.stringify(existingImageUrls));
        }

        // Send new images as files if provided
        if (newImageFiles.length > 0) {
            newImageFiles.forEach((uri, idx) => {
                const filename = `report_image_${Date.now()}_${idx}.jpg`;
                const mimeType = guessMimeTypeFromUri(uri);
                formData.append('images', {
                    uri: uri,
                    type: mimeType,
                    name: filename,
                } as any);
            });
        } else if (data.imageUris !== undefined) {
            // If no new files but imageUris is provided, send existing URLs
            formData.append('imageUris', JSON.stringify(data.imageUris));
        }

        const token = await SecureStore.getItemAsync('token');
        if (!token) {
            throw { msg: 'Not authenticated. Please login again.' };
        }

        const url = `${API_BASE_URL}/report/${id}`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to update report' }));
            throw { msg: errorData.message || errorData.msg || 'Failed to update report' };
        }

        const result: ReportResponse = await response.json();
        return result;
    } catch (error: any) {
        console.log('Update report error:', error);
        
        if (error.message && (error.message.includes('Network') || error.message.includes('fetch'))) {
            throw { 
                msg: 'Network error: Cannot connect to server. Please check your internet connection and ensure the backend is running.',
                code: error.code,
            };
        }
        
        if (error.msg) {
            throw error;
        }
        
        throw { msg: 'Failed to update report' };
    }
};

/**
 * Delete a report
 */
export const deleteReport = async (id: string): Promise<void> => {
    try {
        const response = await apiClient.delete(`/report/${id}`);
        return;
    } catch (error: any) {
        console.log('Delete report error:', error.response?.data || error.message);
        throw error.response?.data || { msg: 'Failed to delete report' };
    }
};
