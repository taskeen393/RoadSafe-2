# RoadSafe AI Chatbot — Architecture

## Overview

AI chatbot powered by Google Gemini (free API), restricted to road safety topics only.
Includes security guardrails, rate limiting, profanity filtering, and emergency detection.

## Folder Structure

```
backend/
├── config/
│   └── gemini.js              # Gemini API config (model, tokens, timeout)
├── controllers/
│   └── chatbotController.js   # Request handler (profanity check → Gemini → respond)
├── middleware/
│   └── rateLimiter.js         # 20 req/min per IP
├── routes/
│   └── chatbot.js             # POST /api/chatbot (validated + rate-limited)
├── services/
│   └── gemini.service.js      # Core AI logic (system prompt, guardrails, emergency)
├── utils/
│   ├── logger.js              # Safe logging (no sensitive data)
│   └── profanityFilter.js     # Basic profanity word filter
├── validators/
│   └── chat.validator.js      # Zod schema + prompt injection protection
└── .env.example               # Environment template

mobile/
├── app/services/
│   ├── chatbotService.ts      # API client with retry logic
│   └── types.ts               # ChatbotRequest / ChatbotResponse types
├── app/Tabs/
│   └── chatbot.tsx            # Full-screen chatbot page
└── components/
    └── ChatbotFAB.tsx         # Floating action button + modal chatbot
```

## API

### POST /api/chatbot

**Request:**
```json
{
  "message": "What should I do after a car accident?",
  "country": "Pakistan"
}
```

- `message` (required): 1-500 characters
- `country` (optional): Country for localized traffic advice

**Response (200):**
```json
{
  "success": true,
  "reply": "IMPORTANT: If this is a real emergency, please contact local emergency services immediately.\n\nHere are the steps to follow after a car accident..."
}
```

**Error (400 — validation):**
```json
{
  "success": false,
  "reply": "Message cannot be empty"
}
```

**Error (429 — rate limit):**
```json
{
  "success": false,
  "reply": "Too many requests. Please wait a moment before sending another message."
}
```

## Security Guardrails

| Layer | Protection |
|-------|-----------|
| Zod Validation | Max 500 chars, required message, trimmed |
| Prompt Injection | Regex patterns block "ignore previous", "system:", "jailbreak", etc. |
| Profanity Filter | Word-list filter blocks offensive language |
| Rate Limiting | 20 requests/minute per IP via express-rate-limit |
| Off-Topic Pre-filter | Regex catches programming, politics, religion, etc. before hitting API |
| System Prompt | Gemini instructed to only answer road safety questions |
| Gemini Safety | Built-in safety settings block harassment, hate, explicit, dangerous |
| Logging | Never logs full messages or API keys |

## Emergency Detection

If user message contains keywords like "accident", "bleeding", "injured", "emergency", "crash",
the response is automatically prepended with:

> IMPORTANT: If this is a real emergency, please contact local emergency services immediately (call 911 or your local emergency number).

## Setup

1. Get a free Gemini API key from https://aistudio.google.com/apikey
2. Add it to `backend/.env`:
   ```
   GOOGLE_API_KEY=your_key_here
   ```
3. Install backend deps: `cd backend && npm install`
4. Start: `npm run dev`

## TanStack Query Example (React Native)

```tsx
import { useMutation } from '@tanstack/react-query';
import apiClient from './apiClient';

interface ChatRequest {
  message: string;
  country?: string;
}

interface ChatResponse {
  success: boolean;
  reply: string;
}

export const useChatMutation = () => {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: async (data) => {
      const res = await apiClient.post<ChatResponse>('/chatbot', data);
      return res.data;
    },
    retry: 1,
    retryDelay: 1000,
  });
};

// Usage in a component:
// const { mutate, isPending, data, error } = useChatMutation();
// mutate({ message: 'What are the speed limits?', country: 'Pakistan' });
```
