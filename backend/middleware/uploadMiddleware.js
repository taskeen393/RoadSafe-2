import multer from 'multer';

// Store in memory so we can stream to Cloudinary (no disk writes)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB per file
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    // Only allow images for now
    if (!file.mimetype?.startsWith('image/')) {
      return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
  },
});

