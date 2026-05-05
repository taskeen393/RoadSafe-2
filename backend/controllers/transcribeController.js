/**
 * Transcription Controller
 * 
 * POST /api/transcribe — Transcribe audio using Gemini
 */

import { transcribeAudioBuffer } from '../services/transcribe.service.js';

/**
 * POST /api/transcribe
 * Accepts audio file upload, returns transcription text
 */
export const transcribeAudio = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No audio file provided',
            });
        }

        const transcription = await transcribeAudioBuffer(
            req.file.buffer,
            req.file.mimetype
        );

        return res.json({
            success: true,
            message: 'Transcription successful',
            data: { text: transcription },
        });
    } catch (err) {
        console.error('Transcription error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to transcribe audio. Please try again.',
        });
    }
};
