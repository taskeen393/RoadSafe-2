import express from 'express';
import multer from 'multer';
import { addReport, getReports, updateReport, deleteReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload, uploadVideo, uploadMixed } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  console.error('❌ Multer error:', err);
  console.error('Error details:', {
    code: err.code,
    field: err.field,
    message: err.message,
    stack: err.stack
  });
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 8MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ message: 'Too many files. Maximum is 5 images and 3 videos.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
};

// Handle OPTIONS preflight requests for CORS
router.options('/', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Expect multipart/form-data for image and video uploads
// Field names: "images" for images, "videos" for videos
// Note: upload.fields allows 0-5 images and 0-3 videos, so reports without media are allowed
router.post('/', 
  (req, res, next) => {
    console.log('📤 POST /api/report received', {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
      hasAuth: !!req.headers.authorization,
      method: req.method,
    });
    next();
  },
  protect,
  (req, res, next) => {
    // Use fields to handle both images and videos
    uploadMixed.fields([
      { name: 'images', maxCount: 5 },
      { name: 'videos', maxCount: 3 }
    ])(req, res, next);
  },
  handleMulterError, 
  addReport
);
router.get('/', protect, getReports);
router.put('/:id', 
  protect,
  (req, res, next) => {
    uploadMixed.fields([
      { name: 'images', maxCount: 5 },
      { name: 'videos', maxCount: 3 }
    ])(req, res, next);
  },
  handleMulterError, 
  updateReport
);
router.delete('/:id', protect, deleteReport);

export default router;

