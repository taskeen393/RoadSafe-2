/**
 * Rate Limiting Middleware
 * 
 * Prevents abuse of API endpoints.
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

/**
 * Auth endpoint rate limiter
 * 10 requests per 15 minutes per IP (stricter to prevent brute-force)
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again in 15 minutes.',
    },
    handler: (req, res, next, options) => {
        logRateLimit(req.ip);
        res.status(429).json(options.message);
    },
});
