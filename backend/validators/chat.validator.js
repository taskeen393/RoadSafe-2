/**
 * Chat Input Validator
 * 
 * Uses Zod for schema validation + prompt injection protection.
 */

import { z } from 'zod';

// ── Zod Schema ──────────────────────────────────────
const chatSchema = z.object({
    message: z
        .string({ required_error: 'Message is required' })
        .min(1, 'Message cannot be empty')
        .max(500, 'Message must be under 500 characters')
        .trim(),
    country: z
        .string()
        .max(100, 'Country must be under 100 characters')
        .trim()
        .optional(),
});

// ── Prompt Injection Patterns ───────────────────────
const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?previous/i,
    /ignore\s+(all\s+)?above/i,
    /disregard\s+(all\s+)?previous/i,
    /forget\s+(all\s+)?previous/i,
    /system\s*:/i,
    /\bprompt\s*:/i,
    /act\s+as\s+(a\s+)?different/i,
    /you\s+are\s+now/i,
    /new\s+instructions/i,
    /override\s+(your\s+)?instructions/i,
    /pretend\s+(you\s+are|to\s+be)/i,
    /jailbreak/i,
    /DAN\s+mode/i,
    /developer\s+mode/i,
];

/**
 * Check if a message contains prompt injection attempts
 * @param {string} message
 * @returns {boolean}
 */
const hasPromptInjection = (message) => {
    return INJECTION_PATTERNS.some(pattern => pattern.test(message));
};

/**
 * Express middleware: validate chat input
 */
export const validateChatInput = (req, res, next) => {
    // 1. Schema validation
    const result = chatSchema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.errors.map(e => e.message);
        return res.status(400).json({
            success: false,
            reply: errors[0],
        });
    }

    // 2. Prompt injection check
    if (hasPromptInjection(result.data.message)) {
        return res.status(400).json({
            success: false,
            reply: 'Your message could not be processed. Please ask a road safety question.',
        });
    }

    // Attach validated data
    req.body = result.data;
    next();
};
