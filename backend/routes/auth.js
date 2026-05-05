import express from 'express';
import { signup, login } from '../controllers/authController.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/signup', authRateLimiter, signup);
router.post('/login', authRateLimiter, login);

export default router;
