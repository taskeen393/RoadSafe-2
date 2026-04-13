/**
 * Transcribe Service
 * 
 * Uses Google Gemini 1.5/2.0 Flash to transcribe audio to text.
 * Gemini 1.5+ supports multimodal input, including audio files.
 */

import axios from 'axios';
import { File } from 'expo-file-system';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_MODEL = 'gemini-1.5-flash'; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Transcribe audio file to text using Gemini
 * @param uri Local file URI (from expo-av)
 * @returns Transcribed text
 */
export const transcribeAudio = async (uri: string): Promise<string> => {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error('Gemini API Key is missing. Check your .env file.');
        }

        // 1. Read audio file as base64 using new SDK 54 File API
        const file = new File(uri);
        const base64Audio = await file.base64();

        // 2. Determine mime type (expo-av usually records in m4a/caf/wav)
        const mimeType = uri.endsWith('.wav') ? 'audio/wav' : 
                         uri.endsWith('.aac') ? 'audio/aac' : 
                         uri.endsWith('.mp3') ? 'audio/mp3' : 'audio/m4a';

        // 3. Prepare Gemini Request
        // We ask Gemini to transcribe the audio exactly as it hears it.
        const payload = {
            contents: [
                {
                    parts: [
                        {
                            text: "Transcribe the following audio accurately. If it's in Urdu or Roman Urdu, transcribe it in Urdu script or Roman Urdu exactly as spoken. Return ONLY the transcription text."
                        },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: base64Audio
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.0, // Low temperature for accuracy
                maxOutputTokens: 1000,
            }
        };

        // 4. Call Gemini
        const response = await axios.post(GEMINI_URL, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000, // Audio processing can take time
        });

        const transcription = response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        
        return transcription.trim();

    } catch (error: any) {
        console.error('Transcription error:', error?.response?.data || error.message);
        throw new Error('Failed to transcribe audio. ' + (error.message || ''));
    }
};
