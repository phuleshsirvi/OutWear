import multer from 'multer';

// Memory storage keeps file buffer in memory for streaming to Cloudinary
const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed');
      error.code = 'INVALID_FILE_TYPE';
      cb(error);
    }
  },
});

/**
 * Middleware for single image upload on field 'image'.
 * Validates file presence, file type, and file size with clear 400 errors.
 */
export const uploadImageMiddleware = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large. Maximum allowed size is 5 MB',
        });
      }
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          error: err.message,
        });
      }
      return res.status(400).json({
        error: err.message || 'File upload error',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Image file is required',
      });
    }

    next();
  });
};

export default uploadImageMiddleware;
