import express from 'express';
import multer from 'multer';
import { updateProfile, getProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  console.error('❌ Multer error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 8MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
};

// Get current user profile
router.get('/profile', protect, getProfile);

// Update user profile (with optional profile image)
router.put('/profile', 
  protect,
  upload.single('profileImage'),
  handleMulterError,
  updateProfile
);

export default router;
