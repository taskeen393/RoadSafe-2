import Report from '../models/Report1.js';
import { initCloudinary } from '../config/cloudinary.js';

function toNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseMaybeJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    // fallback: single string
    return [value];
  }
  return [];
}

// Get all reports
export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ _id: -1 });
    res.status(200).json(reports);
  } catch (error) {
    console.error("Get reports error:", error.message);
    res.status(500).json({ message: error.message });
  }
};
export const addReport = async (req, res) => {
  try {
    const uploadedImageUrls = [];
    const files = req.files || [];

    // Upload images (if provided) to Cloudinary and store secure URLs
    if (files.length) {
      const cloudinaryConfig = initCloudinary();
      
      if (!cloudinaryConfig) {
        return res.status(400).json({ 
          message: 'Image upload requires Cloudinary configuration. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env' 
        });
      }

      const { cloudinary, folder } = cloudinaryConfig;

      for (const file of files) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type: 'image',
              },
              (err, uploadResult) => {
                if (err) return reject(err);
                return resolve(uploadResult);
              }
            );
            stream.end(file.buffer);
          });

          if (result?.secure_url) uploadedImageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload image to Cloudinary. Please check your Cloudinary configuration.' 
          });
        }
      }
    }

    // Backwards compatible: if client still sends imageUris in body, accept them if no files uploaded
    const imageUrisFromBody = parseMaybeJsonArray(req.body.imageUris);
    const finalImageUris = uploadedImageUrls.length ? uploadedImageUrls : imageUrisFromBody;

    const report = await Report.create({
      title: req.body.title,
      description: req.body.description,
      user: req.user.name,
      userId: req.user._id,
      location: req.body.location,
      lat: toNumber(req.body.lat),
      lon: toNumber(req.body.lon),
      imageUris: finalImageUris,
      // NOTE: video uploads not supported yet; keep existing field for compatibility
      videoUris: parseMaybeJsonArray(req.body.videoUris),
    });

    res.status(201).json(report);
  } catch (error) {
    console.error("Add report error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Update a report
export const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user is the owner
    if (report.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this report' });
    }

    const uploadedImageUrls = [];
    const files = req.files || [];

    // Upload new images (if provided) to Cloudinary
    if (files.length) {
      const cloudinaryConfig = initCloudinary();
      
      if (!cloudinaryConfig) {
        return res.status(400).json({ 
          message: 'Image upload requires Cloudinary configuration. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env' 
        });
      }

      const { cloudinary, folder } = cloudinaryConfig;

      for (const file of files) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder,
                resource_type: 'image',
              },
              (err, uploadResult) => {
                if (err) return reject(err);
                return resolve(uploadResult);
              }
            );
            stream.end(file.buffer);
          });

          if (result?.secure_url) uploadedImageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload image to Cloudinary. Please check your Cloudinary configuration.' 
          });
        }
      }
    }

    // Update report fields
    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.lat !== undefined) updateData.lat = toNumber(req.body.lat);
    if (req.body.lon !== undefined) updateData.lon = toNumber(req.body.lon);
    if (uploadedImageUrls.length > 0) {
      // Replace existing images with new ones
      updateData.imageUris = uploadedImageUrls;
    } else if (req.body.imageUris !== undefined) {
      // Allow updating imageUris from body if no new files uploaded
      updateData.imageUris = parseMaybeJsonArray(req.body.imageUris);
    }
    if (req.body.videoUris !== undefined) {
      updateData.videoUris = parseMaybeJsonArray(req.body.videoUris);
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedReport);
  } catch (error) {
    console.error("Update report error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Delete a report
export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user is the owner
    if (report.userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    await Report.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error("Delete report error:", error.message);
    res.status(500).json({ message: error.message });
  }
};


