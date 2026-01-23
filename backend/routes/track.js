import express from 'express';
import { createSos, getSosEvents } from '../controllers/trackController.js';

const router = express.Router();

router.post('/', createSos);
router.get('/', getSosEvents);

export default router;
