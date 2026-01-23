import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth.js';
import chatbotRoute from './routes/chatbot.js';
import reportRoutes from './routes/report.js';
import trackRoute from './routes/track.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { dbName: 'AMT_DB' })
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.error('MongoDB error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/chatbot', chatbotRoute);
app.use('/api/sos', trackRoute);

// Root route
app.get('/', (req, res) => {
  res.send('Backend Running 🚀');
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
