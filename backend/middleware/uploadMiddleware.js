import multer from 'multer';

// Store in memory so we can stream to Cloudinary (no disk writes)
const storage = multer.memoryStorage();

// Upload middleware for images
export const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB per file
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    // Allow images
    if (file.mimetype?.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image uploads are allowed for this field'));
  },
});

// Upload middleware for videos (larger file size limit)
export const uploadVideo = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file (videos are larger)
    files: 3, // Allow up to 3 videos
  },
  fileFilter: (_req, file, cb) => {
    // Allow videos
    if (file.mimetype?.startsWith('video/')) {
      return cb(null, true);
    }
    cb(new Error('Only video uploads are allowed for this field'));
  },
});

// Combined upload middleware for both images and videos
export const uploadMixed = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file (to accommodate videos)
    files: 8, // Total files (5 images + 3 videos)
  },
  fileFilter: (_req, file, cb) => {
    // Allow both images and videos
    if (file.mimetype?.startsWith('image/') || file.mimetype?.startsWith('video/')) {
      return cb(null, true);
    }
    cb(new Error('Only image and video uploads are allowed'));
  },
});

