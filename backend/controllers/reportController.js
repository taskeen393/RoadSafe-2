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
    const uploadedVideoUrls = [];
    
    // Handle files from multer - can be array or fields object
    let imageFiles = [];
    let videoFiles = [];
    
    console.log('📥 Received files:', {
      hasFiles: !!req.files,
      filesType: Array.isArray(req.files) ? 'array' : typeof req.files,
      filesKeys: req.files && !Array.isArray(req.files) ? Object.keys(req.files) : 'N/A',
      filesLength: Array.isArray(req.files) ? req.files.length : (req.files ? Object.keys(req.files).length : 0),
    });
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        // Single field upload (backwards compatibility)
        imageFiles = req.files.filter(f => f.mimetype?.startsWith('image/'));
        videoFiles = req.files.filter(f => f.mimetype?.startsWith('video/'));
        console.log('📁 Array format - Images:', imageFiles.length, 'Videos:', videoFiles.length);
      } else if (req.files.images || req.files.videos) {
        // Fields upload (new format)
        imageFiles = req.files.images || [];
        videoFiles = req.files.videos || [];
        console.log('📁 Fields format - Images:', imageFiles.length, 'Videos:', videoFiles.length);
        if (videoFiles.length > 0) {
          console.log('🎥 Video files details:', videoFiles.map(f => ({
            fieldname: f.fieldname,
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
          })));
        }
      }
    }

    const cloudinaryConfig = initCloudinary();
    
    if ((imageFiles.length > 0 || videoFiles.length > 0) && !cloudinaryConfig) {
      return res.status(400).json({ 
        message: 'Media upload requires Cloudinary configuration. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env' 
      });
    }

    // Upload images to Cloudinary
    if (imageFiles.length > 0 && cloudinaryConfig) {
      const { cloudinary, folder } = cloudinaryConfig;

      for (const file of imageFiles) {
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
          console.error('Cloudinary image upload error:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload image to Cloudinary. Please check your Cloudinary configuration.' 
          });
        }
      }
    }

    // Upload videos to Cloudinary
    if (videoFiles.length > 0 && cloudinaryConfig) {
      console.log(`🎬 Starting upload of ${videoFiles.length} video(s) to Cloudinary`);
      const { cloudinary, folder } = cloudinaryConfig;

      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        console.log(`📹 Uploading video ${i + 1}/${videoFiles.length}:`, {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
        
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `${folder}/videos`,
                resource_type: 'video',
                chunk_size: 6000000, // 6MB chunks for large videos
              },
              (err, uploadResult) => {
                if (err) return reject(err);
                return resolve(uploadResult);
              }
            );
            stream.end(file.buffer);
          });

          if (result?.secure_url) {
            uploadedVideoUrls.push(result.secure_url);
            console.log(`✅ Video ${i + 1} uploaded successfully:`, result.secure_url);
          } else {
            console.warn(`⚠️ Video ${i + 1} uploaded but no secure_url in result`);
          }
        } catch (uploadError) {
          console.error(`❌ Cloudinary video ${i + 1} upload error:`, uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload video to Cloudinary. Please check your Cloudinary configuration.' 
          });
        }
      }
      console.log(`✅ All ${uploadedVideoUrls.length} video(s) uploaded successfully`);
    } else if (videoFiles.length > 0) {
      console.warn('⚠️ Videos provided but Cloudinary not configured');
    }

    // Backwards compatible: if client still sends imageUris/videoUris in body, accept them if no files uploaded
    const imageUrisFromBody = parseMaybeJsonArray(req.body.imageUris);
    const videoUrisFromBody = parseMaybeJsonArray(req.body.videoUris);
    
    const finalImageUris = uploadedImageUrls.length > 0 ? uploadedImageUrls : imageUrisFromBody;
    const finalVideoUris = uploadedVideoUrls.length > 0 ? uploadedVideoUrls : videoUrisFromBody;

    console.log('💾 Saving report with:', {
      imageCount: finalImageUris.length,
      videoCount: finalVideoUris.length,
      videoUris: finalVideoUris,
    });

    const report = await Report.create({
      title: req.body.title,
      description: req.body.description,
      user: req.user.name,
      userId: req.user._id,
      location: req.body.location,
      lat: toNumber(req.body.lat),
      lon: toNumber(req.body.lon),
      imageUris: finalImageUris,
      videoUris: finalVideoUris,
    });

    console.log('✅ Report created:', {
      id: report._id,
      imageCount: report.imageUris?.length || 0,
      videoCount: report.videoUris?.length || 0,
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
    const uploadedVideoUrls = [];
    
    // Handle files from multer - can be array or fields object
    let imageFiles = [];
    let videoFiles = [];
    
    if (req.files) {
      if (Array.isArray(req.files)) {
        // Single field upload (backwards compatibility)
        imageFiles = req.files.filter(f => f.mimetype?.startsWith('image/'));
        videoFiles = req.files.filter(f => f.mimetype?.startsWith('video/'));
      } else if (req.files.images || req.files.videos) {
        // Fields upload (new format)
        imageFiles = req.files.images || [];
        videoFiles = req.files.videos || [];
      }
    }

    const cloudinaryConfig = initCloudinary();
    
    if ((imageFiles.length > 0 || videoFiles.length > 0) && !cloudinaryConfig) {
      return res.status(400).json({ 
        message: 'Media upload requires Cloudinary configuration. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env' 
      });
    }

    // Upload new images (if provided) to Cloudinary
    if (imageFiles.length > 0 && cloudinaryConfig) {
      const { cloudinary, folder } = cloudinaryConfig;

      for (const file of imageFiles) {
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
          console.error('Cloudinary image upload error:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload image to Cloudinary. Please check your Cloudinary configuration.' 
          });
        }
      }
    }

    // Upload new videos (if provided) to Cloudinary
    if (videoFiles.length > 0 && cloudinaryConfig) {
      const { cloudinary, folder } = cloudinaryConfig;

      for (const file of videoFiles) {
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: `${folder}/videos`,
                resource_type: 'video',
                chunk_size: 6000000, // 6MB chunks for large videos
              },
              (err, uploadResult) => {
                if (err) return reject(err);
                return resolve(uploadResult);
              }
            );
            stream.end(file.buffer);
          });

          if (result?.secure_url) uploadedVideoUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Cloudinary video upload error:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload video to Cloudinary. Please check your Cloudinary configuration.' 
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
    if (uploadedVideoUrls.length > 0) {
      // Replace existing videos with new ones
      updateData.videoUris = uploadedVideoUrls;
    } else if (req.body.videoUris !== undefined) {
      // Allow updating videoUris from body if no new files uploaded
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


