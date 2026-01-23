import User from '../models/User.js';
import { initCloudinary } from '../config/cloudinary.js';

/**
 * Extract public_id from Cloudinary URL
 */
function extractPublicIdFromUrl(url) {
  try {
    const match = url.match(/\/upload\/v\d+\/(.+)$/);
    if (match && match[1]) {
      const publicId = match[1].replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
      return publicId;
    }
    return null;
  } catch (error) {
    console.error('Error extracting public_id from URL:', url, error);
    return null;
  }
}

/**
 * Delete old profile image from Cloudinary
 */
async function deleteOldProfileImage(oldImageUrl) {
  if (!oldImageUrl) return;

  const cloudinaryConfig = initCloudinary();
  if (!cloudinaryConfig) {
    console.warn('⚠️ Cloudinary not configured, skipping deletion');
    return;
  }

  const { cloudinary } = cloudinaryConfig;
  const publicId = extractPublicIdFromUrl(oldImageUrl);

  if (!publicId) {
    console.warn('⚠️ Could not extract public_id from URL:', oldImageUrl);
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result === 'ok') {
      console.log(`✅ Deleted old profile image: ${publicId}`);
    } else if (result.result === 'not found') {
      console.warn(`⚠️ Profile image not found in Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error('❌ Error deleting old profile image:', error);
  }
}

/**
 * Update user profile (including profile picture)
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let imageFile = null;

    // Handle profile image upload
    if (req.file) {
      imageFile = req.file;
    } else if (req.files && req.files.profileImage) {
      imageFile = Array.isArray(req.files.profileImage) ? req.files.profileImage[0] : req.files.profileImage;
    }

    // Upload new profile image to Cloudinary
    if (imageFile) {
      const cloudinaryConfig = initCloudinary();

      if (!cloudinaryConfig) {
        return res.status(400).json({
          message: 'Image upload requires Cloudinary configuration. Please configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend/.env'
        });
      }

      const { cloudinary, folder } = cloudinaryConfig;

      try {
        // Delete old profile image if it exists
        if (user.profileImage) {
          await deleteOldProfileImage(user.profileImage);
        }

        // Upload new profile image
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: `${folder}/profiles`,
              resource_type: 'image',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto' },
              ],
            },
            (err, uploadResult) => {
              if (err) return reject(err);
              return resolve(uploadResult);
            }
          );
          stream.end(imageFile.buffer);
        });

        if (result?.secure_url) {
          user.profileImage = result.secure_url;
          console.log(`✅ Profile image uploaded: ${result.secure_url}`);
        }
      } catch (uploadError) {
        console.error('Cloudinary profile image upload error:', uploadError);
        return res.status(500).json({
          message: 'Failed to upload profile image to Cloudinary. Please check your Cloudinary configuration.'
        });
      }
    }

    // Update other user fields if provided
    if (req.body.name) {
      user.name = req.body.name;
    }
    if (req.body.email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = req.body.email;
    }

    await user.save();

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
    };

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userResponse,
    });
  } catch (error) {
    console.error('Update profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: error.message });
  }
};
