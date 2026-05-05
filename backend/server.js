import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

import { initCloudinary } from './config/cloudinary.js';

// Routes
import authRoutes from './routes/auth.js';
import chatbotRoute from './routes/chatbot.js';
import reportRoutes from './routes/report.js';
import trackRoute from './routes/track.js';
import transcribeRoute from './routes/transcribe.js';
import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
// CORS configuration - allow all origins for development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`, {
    contentType: req.headers['content-type'],
    hasAuth: !!req.headers.authorization,
    origin: req.headers.origin,
    ip: req.ip || req.connection.remoteAddress,
  });
  next();
});

// Body parsing - express.json() automatically skips multipart/form-data
// Multer will handle multipart/form-data in the route handlers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { dbName: 'AMT_DB' })
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.error('MongoDB error:', err));

// Check Cloudinary configuration at startup (warn if missing, but don't fail)
const cloudinaryConfig = initCloudinary();
if (cloudinaryConfig) {
  console.log('Cloudinary configured ✅');
} else {
  console.warn('⚠️  Cloudinary not configured - image uploads will be disabled. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env');
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/chatbot', chatbotRoute);
app.use('/api/sos', trackRoute);
app.use('/api/user', userRoutes);
app.use('/api/transcribe', transcribeRoute);

// Root route
app.get('/', (req, res) => {
  res.send('Backend Running 🚀');
});

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error('Stack:', err.stack);
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error',
  });
});

// Start server - listen on 0.0.0.0 to accept connections from other devices on the network
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} 🚀`);
  // console.log(`📱 Access from mobile: http://192.168.100.197:${PORT}/api`);
});
