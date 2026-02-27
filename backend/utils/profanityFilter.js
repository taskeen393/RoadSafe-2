/**
 * Basic Profanity Filter
 * 
 * Checks user input for inappropriate language.
 * Keeps the word list minimal and focused on blocking
 * clearly offensive content.
 */

const PROFANITY_LIST = [
    'fuck', 'shit', 'ass', 'bitch', 'damn', 'bastard',
    'dick', 'pussy', 'cock', 'cunt', 'whore', 'slut',
    'nigger', 'faggot', 'retard',
];

/**
 * Check if a message contains profanity
 * @param {string} message - The user message to check
 * @returns {{ hasProfanity: boolean, word?: string }}
 */
export const checkProfanity = (message) => {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(/\s+/);

    for (const word of words) {
        const cleanWord = word.replace(/[^a-z]/g, '');
        if (PROFANITY_LIST.includes(cleanWord)) {
            return { hasProfanity: true, word: cleanWord };
        }
    }

    return { hasProfanity: false };
};

/**
 * Get the standard profanity rejection message
 * @returns {string}
 */
export const getProfanityResponse = () => {
    return 'Please keep the conversation respectful. I am here to help you with road safety questions.';
};
