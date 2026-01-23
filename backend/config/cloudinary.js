import { v2 as cloudinary } from 'cloudinary';

/**
 * Initialize Cloudinary configuration
 * @returns {Object|null} Returns { cloudinary, folder } if configured, null otherwise
 */
export function initCloudinary() {
  // Read env vars inside the function (after dotenv.config() has run)
  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    CLOUDINARY_FOLDER,
  } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return null; // Return null instead of throwing - let controller handle gracefully
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  return { cloudinary, folder: CLOUDINARY_FOLDER || 'roadsafe/reports' };
}

export { cloudinary };

