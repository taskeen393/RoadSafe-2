/**
 * Chatbot Service
 * 
 * Uses backend API to communicate with Google Gemini.
 * AI logic has been moved to the backend to secure API keys and unify behavior.
 */

import apiClient from './apiClient';

export interface ChatbotResponse {
    success: boolean;
    reply: string;
}

/**
 * Send a message to the backend chatbot API.
 */
export const sendMessage = async (
    message: string,
    country: string = 'Pakistan'
): Promise<ChatbotResponse> => {
    try {
        const response = await apiClient.post('/chatbot', {
            message,
            country
        });

        // Backend already handles off-topic, emergency, and formatting
        // It returns { success: true, reply: string }
        return {
            success: response.data.success ?? true,
            reply: response.data.reply
        };

    } catch (error: any) {
        console.error('Chatbot API error:', error?.response?.data || error?.message);

        if (error?.response?.status === 429) {
            return {
                success: false,
                reply: 'The AI service is temporarily busy. Please try again in a moment.',
            };
        }

        if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
            return {
                success: false,
                reply: 'The AI service is taking too long. Please try again.',
            };
        }

        // Return backend provided error message if available
        if (error?.response?.data?.reply) {
             return {
                success: false,
                reply: error.response.data.reply,
             };
        }

        return {
            success: false,
            reply: 'Something went wrong. Please try again later.',
        };
    }
};
