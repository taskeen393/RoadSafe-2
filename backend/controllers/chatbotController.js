/**
 * Chatbot Controller
 * 
 * Handles POST /api/chatbot — AI road safety chat
 * Handles GET /api/chatbot — Chat history
 * 
 * Uses Google Gemini instead of OpenAI.
 * Includes profanity filtering and safe logging.
 */

import Chat from '../models/Chat.js';
import { generateRoadSafetyResponse } from '../services/gemini.service.js';
import { checkProfanity, getProfanityResponse } from '../utils/profanityFilter.js';
import { logChatInteraction } from '../utils/logger.js';

/**
 * POST /api/chatbot
 * Send a message to the AI chatbot
 */
export const chatWithBot = async (req, res) => {
    const startTime = Date.now();

    try {
        const { message, country } = req.body;

        // 1. Profanity check
        const profanityResult = checkProfanity(message);
        if (profanityResult.hasProfanity) {
            logChatInteraction({
                messageLength: message.length,
                country,
                responseTimeMs: Date.now() - startTime,
                success: true,
                error: 'profanity_blocked',
            });

            return res.json({
                success: true,
                reply: getProfanityResponse(),
            });
        }

        // 2. Call Gemini service
        const reply = await generateRoadSafetyResponse(message, country);

        // 3. Save to MongoDB (truncate message for privacy)
        try {
            await Chat.create({
                user: 'User',
                message: message.substring(0, 100),
                response: reply.substring(0, 500),
            });
        } catch (dbErr) {
            // Don't fail the request if DB save fails
            console.error('DB save error (non-critical):', dbErr.message);
        }

        // 4. Log safely
        logChatInteraction({
            messageLength: message.length,
            country,
            responseTimeMs: Date.now() - startTime,
            success: true,
            emergencyDetected: reply.includes('emergency services immediately'),
        });

        // 5. Return response
        return res.json({
            success: true,
            reply,
        });

    } catch (err) {
        const responseTimeMs = Date.now() - startTime;

        logChatInteraction({
            messageLength: req.body?.message?.length || 0,
            country: req.body?.country,
            responseTimeMs,
            success: false,
            error: err.message,
        });

        // Handle timeout errors
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
            return res.status(504).json({
                success: false,
                reply: 'The AI service is taking too long to respond. Please try again.',
            });
        }

        // Handle Gemini quota errors
        if (err.response?.status === 429) {
            return res.status(429).json({
                success: false,
                reply: 'The AI service is temporarily busy. Please try again in a moment.',
            });
        }

        console.error('Chatbot error:', err.message);
        return res.status(500).json({
            success: false,
            reply: 'Sorry, something went wrong. Please try again later.',
        });
    }
};

/**
 * GET /api/chatbot
 * Fetch chat history
 */
export const getChats = async (req, res) => {
    try {
        const chats = await Chat.find().sort({ dateTime: -1 }).limit(50);
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
    }
};
