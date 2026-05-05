/**
 * Transcription Service
 * 
 * Uses Google Gemini to transcribe audio buffers to text.
 * Keeps all Gemini API calls on the backend.
 */

import axios from 'axios';
import { getGeminiUrl, isGeminiConfigured } from '../config/gemini.js';

/**
 * Transcribe an audio buffer using Gemini
 * @param {Buffer} buffer - Audio file buffer
 * @param {string} mimeType - MIME type of the audio (e.g. audio/m4a)
 * @returns {Promise<string>} Transcribed text
 */
export const transcribeAudioBuffer = async (buffer, mimeType) => {
    if (!isGeminiConfigured()) {
        throw new Error('Gemini API key not configured');
    }

    const base64Audio = buffer.toString('base64');

    const payload = {
        contents: [
            {
                parts: [
                    {
                        text: 'Transcribe the following audio accurately. If it\'s in Urdu or Roman Urdu, transcribe it in Urdu script or Roman Urdu exactly as spoken. Return ONLY the transcription text.',
                    },
                    {
                        inlineData: {
                            mimeType: mimeType || 'audio/m4a',
                            data: base64Audio,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 1000,
        },
    };

    const response = await axios.post(getGeminiUrl(), payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });

    const transcription = response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return transcription.trim();
};
