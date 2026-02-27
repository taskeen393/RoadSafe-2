/**
 * Chatbot Routes
 * 
 * POST /api/chatbot — Send message to AI (validated + rate-limited)
 * GET  /api/chatbot — Fetch chat history
 */

import express from 'express';
import { chatWithBot, getChats } from '../controllers/chatbotController.js';
import { validateChatInput } from '../validators/chat.validator.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// POST — AI chat (with validation + rate limiting)
router.post('/', chatRateLimiter, validateChatInput, chatWithBot);

// GET — Chat history
router.get('/', getChats);

export default router;
