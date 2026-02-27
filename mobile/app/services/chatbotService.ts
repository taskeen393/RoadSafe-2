/**
 * Chatbot Service
 * 
 * Handles chatbot API calls with retry logic and timeout handling.
 */

import apiClient from './apiClient';
import { ChatbotRequest, ChatbotResponse } from './types';

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 1000;

/**
 * Delay utility for retry logic
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Send a message to the AI chatbot and get a response
 * Includes automatic retry on failure.
 */
export const sendMessage = async (
    message: string,
    country?: string,
): Promise<ChatbotResponse> => {
    let lastError: any;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const payload: ChatbotRequest = { message };
            if (country) {
                payload.country = country;
            }

            const response = await apiClient.post<ChatbotResponse>('/chatbot', payload);
            return response.data;
        } catch (error: any) {
            lastError = error;

            // Don't retry on validation/client errors (4xx)
            const status = error.response?.status;
            if (status && status >= 400 && status < 500 && status !== 429) {
                break;
            }

            // Wait before retry (except on last attempt)
            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY_MS);
            }
        }
    }

    // Return error in the expected shape if server responded
    if (lastError?.response?.data) {
        return lastError.response.data as ChatbotResponse;
    }

    // Network error fallback
    return {
        success: false,
        reply: 'Unable to reach the server. Please check your connection and try again.',
    };
};
