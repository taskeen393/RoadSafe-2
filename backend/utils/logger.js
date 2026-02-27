/**
 * Safe Logger Utility
 * 
 * Logs AI chatbot usage without exposing sensitive user data.
 * Truncates messages, never logs API keys.
 */

/**
 * Log a chatbot interaction safely
 * @param {object} params
 * @param {string} params.messageLength - Length of user message
 * @param {string} [params.country] - Country if provided
 * @param {number} params.responseTimeMs - Response time in ms
 * @param {boolean} params.success - Whether the request succeeded
 * @param {boolean} [params.emergencyDetected] - Whether emergency was detected
 * @param {string} [params.error] - Error message if failed
 */
export const logChatInteraction = ({
    messageLength,
    country,
    responseTimeMs,
    success,
    emergencyDetected = false,
    error,
}) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        type: 'CHATBOT',
        messageLength,
        country: country || 'not_specified',
        responseTimeMs,
        success,
        emergencyDetected,
    };

    if (error) {
        logEntry.error = error;
    }

    if (success) {
        console.log('📊 Chat:', JSON.stringify(logEntry));
    } else {
        console.error('📊 Chat Error:', JSON.stringify(logEntry));
    }
};

/**
 * Log rate limit hit
 * @param {string} ip - Client IP (truncated for privacy)
 */
export const logRateLimit = (ip) => {
    const truncatedIp = ip ? ip.replace(/\.\d+$/, '.***') : 'unknown';
    console.warn(`⚠️ Rate limit hit: ${truncatedIp} at ${new Date().toISOString()}`);
};
