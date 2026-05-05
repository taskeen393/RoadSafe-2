/**
 * Transcribe Service
 * 
 * Sends audio to the backend for transcription via Gemini.
 * No API keys on the client — all AI calls go through the backend.
 */

import apiClient from './apiClient';
import * as FileSystem from 'expo-file-system';

/**
 * Transcribe audio file to text using the backend transcription endpoint
 * @param uri Local file URI (from expo-av)
 * @returns Transcribed text
 */
export const transcribeAudio = async (uri: string): Promise<string> => {
    try {

        // 2. Determine mime type
        const mimeType = uri.endsWith('.wav') ? 'audio/wav' :
                         uri.endsWith('.aac') ? 'audio/aac' :
                         uri.endsWith('.mp3') ? 'audio/mp3' : 'audio/m4a';

        // 3. Create FormData with the audio file
        const formData = new FormData();
        formData.append('audio', {
            uri,
            name: `recording.${mimeType.split('/')[1]}`,
            type: mimeType,
        } as any);

        // 4. Send to backend
        const response = await apiClient.post('/transcribe', formData, {
            timeout: 30000,
        });

        return response.data?.data?.text ?? '';

    } catch (error: any) {
        console.error('Transcription error:', error?.response?.data || error.message);
        throw new Error('Failed to transcribe audio. ' + (error?.response?.data?.message || error.message || ''));
    }
};
