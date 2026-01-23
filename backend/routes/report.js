import express from 'express';
import { addReport, getReports } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addReport);
router.get('/', protect, getReports);

export default router;

