/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse of the chatbot API endpoint.
 */

import rateLimit from 'express-rate-limit';
import { logRateLimit } from '../utils/logger.js';

/**
 * Chat endpoint rate limiter
 * 20 requests per minute per IP
 */
export const chatRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        reply: 'Too many requests. Please wait a moment before sending another message.',
    },
    handler: (req, res, next, options) => {
        logRateLimit(req.ip);
        res.status(429).json(options.message);
    },
});
