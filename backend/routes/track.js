import express from 'express';
import { createSos, getSosEvents } from '../controllers/trackController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createSos);
router.get('/', protect, getSosEvents);

export default router;
