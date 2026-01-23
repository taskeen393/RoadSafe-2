import Report from '../models/Report1.js';
import { initCloudinary } from '../config/cloudinary.js';

/**
 * Extract public_id from Cloudinary URL
 * URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{folder}/{public_id}.{format}
 * Example: https://res.cloudinary.com/moinuddin/image/upload/v1769188624/roadsafe/reports/v5lqyatra57amwrmnlyn.jpg
 * Public ID should be: roadsafe/reports/v5lqyatra57amwrmnlyn
 */
function extractPublicIdFromUrl(url, resourceType = 'image') {
  try {
    // Match the pattern to extract everything after /upload/v{version}/
    // This includes folder path and filename
    const match = url.match(/\/upload\/v\d+\/(.+)$/);
    if (match && match[1]) {
      // Remove file extension but keep folder path
      const publicId = match[1].replace(/\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|mkv|webm)$/i, '');
      return publicId;
    }
    return null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', url, error);
    return null;
  }
}

/**
 * Delete files from Cloudinary
 * @param {string[]} urls - Array of Cloudinary URLs
 * @param {string} resourceType - 'image' or 'video'
 */
async function deleteFromCloudinary(urls, resourceType = 'image') {
  if (!urls || urls.length === 0) return;

  const cloudinaryConfig = initCloudinary();
  if (!cloudinaryConfig) {
    console.warn('⚠️ Cloudinary not configured, skipping deletion');
    return;
  }

  const { cloudinary } = cloudinaryConfig;
  const publicIds = urls
    .map(url => extractPublicIdFromUrl(url, resourceType))
    .filter(id => id !== null);

  if (publicIds.length === 0) {
    console.warn('⚠️ No valid public_ids extracted from URLs');
    return;
  }

  console.log(`🗑️ Deleting ${publicIds.length} ${resourceType}(s) from Cloudinary:`, publicIds);

  try {
    // Delete multiple files at once
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type: resourceType,
      type: 'upload',
    });

    if (result.deleted) {
      console.log(`✅ Successfully deleted ${Object.keys(result.deleted).length} ${resourceType}(s)`);
      Object.entries(result.deleted).forEach(([publicId, status]) => {
        if (status === 'not_found') {
          console.warn(`⚠️ ${resourceType} not found in Cloudinary: ${publicId}`);
        }
      });
    }

    if (result.not_found && result.not_found.length > 0) {
      console.warn(`⚠️ ${result.not_found.length} ${resourceType}(s) not found:`, result.not_found);
    }
  } catch (error) {
    console.error(`❌ Error deleting ${resourceType}(s) from Cloudinary:`, error);
    // Don't throw - we don't want to fail the request if deletion fails
  }
}

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
    const mongoose = (await import('mongoose')).default;
    const reports = await Report.find().sort({ _id: -1 });
    
    // Get user profile images for all unique userIds
    const userIds = [...new Set(reports.map(r => r.userId).filter(Boolean))];
    
    console.log('📊 Fetching reports:', {
      reportCount: reports.length,
      uniqueUserIds: userIds.length,
      userIds: userIds.slice(0, 5), // Log first 5
    });
    
    if (userIds.length > 0) {
      const User = (await import('../models/User.js')).default;
      
      // Convert string userIds to ObjectIds for query (userId is stored as String in Report)
      const objectIds = userIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
      
      if (objectIds.length > 0) {
        const users = await User.find({ _id: { $in: objectIds } }).select('_id profileImage');
        
        console.log('👤 Found users:', {
          userCount: users.length,
          usersWithProfile: users.filter(u => u.profileImage).length,
        });
        
        // Create map: userId string -> profileImage (only for users with images)
        const userProfileMap = {};
        users.forEach(u => {
          const idStr = u._id.toString();
          // Only add to map if profileImage exists and is not null/empty
          if (u.profileImage && u.profileImage.trim() !== '') {
            userProfileMap[idStr] = u.profileImage;
            console.log(`✅ User ${idStr} has profile image: ${u.profileImage}`);
          } else {
            console.log(`⚠️ User ${idStr} has NO profile image (value: ${u.profileImage})`);
          }
        });
        
        console.log('📋 User profile map (only users with images):', userProfileMap);
        console.log('🔍 Looking for userIds in reports:', userIds);
        console.log('🔑 Map keys (users with profile images):', Object.keys(userProfileMap));
        
        // Add profileImage to each report
        const reportsWithProfiles = reports.map(report => {
          const reportObj = report.toObject();
          const reportUserId = report.userId ? String(report.userId).trim() : null;
          
          // Always set userProfileImage field
          if (reportUserId && userProfileMap[reportUserId]) {
            // User has a profile image
            reportObj.userProfileImage = userProfileMap[reportUserId];
            console.log(`✅ Report ${report._id}: Added profile image for user ${reportUserId}: ${userProfileMap[reportUserId]}`);
          } else {
            // User doesn't have a profile image or not found
            reportObj.userProfileImage = null;
            if (reportUserId) {
              if (userProfileMap.hasOwnProperty(reportUserId)) {
                console.log(`ℹ️ Report ${report._id}: User ${reportUserId} exists but has no profile image`);
              } else {
                console.log(`⚠️ Report ${report._id}: User ${reportUserId} not found in userProfileMap. Available keys:`, Object.keys(userProfileMap));
              }
            }
          }
          
          return reportObj;
        });
        
        res.status(200).json(reportsWithProfiles);
      } else {
        // Invalid ObjectIds, return reports without profile images
        const reportsArray = reports.map(r => {
          const obj = r.toObject();
          obj.userProfileImage = null; // Explicitly set to null
          return obj;
        });
        res.status(200).json(reportsArray);
      }
    } else {
      // No userIds, just return reports as-is but with userProfileImage field
      const reportsArray = reports.map(r => {
        const obj = r.toObject();
        obj.userProfileImage = null; // Explicitly set to null
        return obj;
      });
      res.status(200).json(reportsArray);
    }
  } catch (error) {
    console.error("Get reports error:", error.message);
    console.error("Error stack:", error.stack);
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

    // Determine which old files to delete
    const oldImageUris = Array.isArray(report.imageUris) ? report.imageUris : [];
    const oldVideoUris = Array.isArray(report.videoUris) ? report.videoUris : [];
    
    let newImageUris = oldImageUris;
    let newVideoUris = oldVideoUris;

    // Update report fields
    const updateData = {};
    if (req.body.title) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.lat !== undefined) updateData.lat = toNumber(req.body.lat);
    if (req.body.lon !== undefined) updateData.lon = toNumber(req.body.lon);
    
    if (uploadedImageUrls.length > 0) {
      // Replace existing images with new ones
      newImageUris = uploadedImageUrls;
      updateData.imageUris = uploadedImageUrls;
    } else if (req.body.imageUris !== undefined) {
      // Allow updating imageUris from body if no new files uploaded
      newImageUris = parseMaybeJsonArray(req.body.imageUris);
      updateData.imageUris = newImageUris;
    }
    
    if (uploadedVideoUrls.length > 0) {
      // Replace existing videos with new ones
      newVideoUris = uploadedVideoUrls;
      updateData.videoUris = uploadedVideoUrls;
    } else if (req.body.videoUris !== undefined) {
      // Allow updating videoUris from body if no new files uploaded
      newVideoUris = parseMaybeJsonArray(req.body.videoUris);
      updateData.videoUris = newVideoUris;
    }

    // Delete old images that are no longer in the new list
    if (uploadedImageUrls.length > 0 || req.body.imageUris !== undefined) {
      const imagesToDelete = oldImageUris.filter(url => !newImageUris.includes(url));
      if (imagesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${imagesToDelete.length} old image(s) from Cloudinary`);
        await deleteFromCloudinary(imagesToDelete, 'image');
      }
    }

    // Delete old videos that are no longer in the new list
    if (uploadedVideoUrls.length > 0 || req.body.videoUris !== undefined) {
      const videosToDelete = oldVideoUris.filter(url => !newVideoUris.includes(url));
      if (videosToDelete.length > 0) {
        console.log(`🗑️ Deleting ${videosToDelete.length} old video(s) from Cloudinary`);
        await deleteFromCloudinary(videosToDelete, 'video');
      }
    }

    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    console.log(`✅ Report ${req.params.id} updated successfully`);
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

    // Delete images and videos from Cloudinary before deleting the report
    const imageUris = Array.isArray(report.imageUris) ? report.imageUris : [];
    const videoUris = Array.isArray(report.videoUris) ? report.videoUris : [];

    console.log(`🗑️ Deleting report ${req.params.id} with ${imageUris.length} image(s) and ${videoUris.length} video(s)`);

    // Delete images from Cloudinary
    if (imageUris.length > 0) {
      await deleteFromCloudinary(imageUris, 'image');
    }

    // Delete videos from Cloudinary
    if (videoUris.length > 0) {
      await deleteFromCloudinary(videoUris, 'video');
    }

    // Delete the report from database
    await Report.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Report ${req.params.id} deleted successfully`);
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error("Delete report error:", error.message);
    res.status(500).json({ message: error.message });
  }
};


