/**
 * Transcription Routes
 * 
 * POST /api/transcribe — Upload audio for transcription
 */

import express from 'express';
import multer from 'multer';
import { transcribeAudio } from '../controllers/transcribeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { chatRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// In-memory storage for audio uploads (max 10MB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

// POST — transcribe audio (auth + rate-limited)
router.post('/', protect, chatRateLimiter, upload.single('audio'), transcribeAudio);

export default router;
