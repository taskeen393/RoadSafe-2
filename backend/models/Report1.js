import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  user: { type: String, required: true },
  userId: { type: String, required: true },
  location: { type: String },                 // location text
  lat: { type: Number },                      // latitude
  lon: { type: Number },                      // longitude
  imageUris: { type: [String], default: [] }, // images array
  videoUris: { type: [String], default: [] }, // videos array
  createdAt: { type: Date, default: Date.now },
});

const Report = mongoose.model('Report', reportSchema);
export default Report;
