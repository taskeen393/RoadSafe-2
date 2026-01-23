import express from 'express';
import { chatWithBot, getChats } from '../controllers/chatbotController.js';

const router = express.Router();

router.post('/', chatWithBot);
router.get('/', getChats);

export default router;
