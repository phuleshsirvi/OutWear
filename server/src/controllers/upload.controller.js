import cloudinary from '../config/cloudinary.js';

/**
 * Helper function to upload an in-memory buffer to Cloudinary via upload_stream
 * - Folder: outwear/<userId>
 * - Dimensions: max 1200px on the longest side with crop: 'limit'
 * - Optimizations: quality: 'auto', fetch_format: 'auto'
 */
const uploadToCloudinary = (fileBuffer, userId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `outwear/${userId}`,
        resource_type: 'image',
        width: 1200,
        height: 1200,
        crop: 'limit',
        quality: 'auto',
        fetch_format: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * POST /api/uploads/image
 * Handles image upload to Cloudinary for authenticated users.
 * Returns { imageUrl, imagePublicId } with the secure HTTPS URL.
 */
export const uploadImage = async (req, res, next) => {
  try {
    const result = await uploadToCloudinary(req.file.buffer, req.user.id);

    return res.status(200).json({
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  uploadImage,
};
