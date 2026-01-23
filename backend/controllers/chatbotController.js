import dotenv from 'dotenv';
import OpenAI from 'openai';
import Chat from '../models/Chat.js';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export const chatWithBot = async (req, res) => {
    try {
        const { user, message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });

        console.log('Received message:', message);

        // ✅ Check if API key is loaded
        if (!process.env.OPENAI_API_KEY) {
            console.error('OpenAI API key not found!');
            return res.status(500).json({ error: 'OpenAI API key not loaded' });
        }

        let botReply = '';

        try {
            // OpenAI request
            const completion = await openai.responses.create({
                model: 'gpt-4.1-mini',
                input: message
            });

            botReply = completion.output_text || "Sorry, no reply";

        } catch (openaiErr) {
            console.error('OPENAI ERROR:', openaiErr);

            // Graceful fallback for quota / other errors
            if (openaiErr.code === 'insufficient_quota' || openaiErr.status === 429) {
                botReply = "Sorry, OpenAI quota exceeded. Try again later!";
            } else {
                botReply = "Sorry, OpenAI request failed!";
            }
        }

        console.log('Bot reply:', botReply);

        // Save to MongoDB
        await Chat.create({
            user: user || 'User',
            message,
            response: botReply
        });

        res.json({ user: message, bot: botReply });

    } catch (err) {
        console.error('SERVER ERROR:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

export const getChats = async (req, res) => {
    try {
        const chats = await Chat.find().sort({ dateTime: 1 });
        res.json(chats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chats', details: err.message });
    }
};
