/**
 * Report Service
 * 
 * Handles all report-related API calls:
 * - Submit new report
 * - Get all reports
 * - Get single report
 */

import apiClient from './apiClient';
import { ReportRequest, ReportResponse } from './types';

/**
 * Submit a new incident report
 */
export const submitReport = async (data: ReportRequest): Promise<ReportResponse> => {
    try {
        const response = await apiClient.post<ReportResponse>('/report', data);
        return response.data;
    } catch (error: any) {
        console.log('Submit report error:', error.response?.data || error.message);
        throw error.response?.data || { msg: 'Failed to submit report' };
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
