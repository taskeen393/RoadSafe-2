/**
 * Gemini API Configuration
 * 
 * Centralized configuration for Google Gemini REST API.
 * Uses environment variables — never hardcode secrets.
 */

import dotenv from 'dotenv';
dotenv.config();

const geminiConfig = {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    maxOutputTokens: 300,
    temperature: 0.7,
    requestTimeoutMs: 15000,
};

/**
 * Validate that the Gemini API key is configured
 * @returns {boolean}
 */
export const isGeminiConfigured = () => {
    return !!geminiConfig.apiKey;
};

/**
 * Get the full API URL for generating content
 * @returns {string}
 */
export const getGeminiUrl = () => {
    return `${geminiConfig.baseUrl}/${geminiConfig.model}:generateContent?key=${geminiConfig.apiKey}`;
};

export default geminiConfig;
