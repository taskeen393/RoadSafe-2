/**
 * Chatbot Service
 * 
 * Handles chatbot API calls
 */

import apiClient from './apiClient';
import { ChatbotRequest, ChatbotResponse } from './types';

/**
 * Send a message to the chatbot and get a response
 */
export const sendMessage = async (message: string, user: string = 'User'): Promise<ChatbotResponse> => {
    try {
        const payload: ChatbotRequest = { user, message };
        const response = await apiClient.post<ChatbotResponse>('/chatbot', payload);
        return response.data;
    } catch (error: any) {
        console.log('Chatbot error:', error.response?.data || error.message);
        throw error.response?.data || { msg: 'Failed to get chatbot response' };
    }
};
