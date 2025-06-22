// import { v2 as cloudinary } from 'cloudinary';

// // Configure Cloudinary (make sure to set these environment variables)
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// /**
//  * Upload image to Cloudinary
//  * @param {Buffer} fileBuffer - Image buffer
//  * @param {Object} options - Upload options
//  * @returns {Promise<Object>} Cloudinary upload result
//  */
// export const uploadToCloudinary = (fileBuffer, options = {}) => {
//   return new Promise((resolve, reject) => {
//     // Add debug logging
//     console.log('uploadToCloudinary called with buffer length:', fileBuffer ? fileBuffer.length : 'No buffer');
    
//     if (!fileBuffer || fileBuffer.length === 0) {
//       reject(new Error('Empty file buffer provided to uploadToCloudinary'));
//       return;
//     }

//     const defaultOptions = {
//       resource_type: 'image',
//       folder: 'reviews',
//       transformation: [
//         { width: 800, height: 600, crop: 'limit' },
//         { quality: 'auto' },
//         { format: 'webp' }
//       ]
//     };

//     const uploadOptions = { ...defaultOptions, ...options };

//     cloudinary.uploader.upload_stream(
//       uploadOptions,
//       (error, result) => {
//         if (error) {
//           console.error('Cloudinary upload error:', error);
//           reject(error);
//         } else {
//           console.log('Cloudinary upload success:', result.secure_url);
//           resolve(result);
//         }
//       }
//     ).end(fileBuffer);
//   });
// };

// /**
//  * Delete image from Cloudinary
//  * @param {string} publicId - Public ID of the image to delete
//  * @returns {Promise<Object>} Cloudinary deletion result
//  */
// export const deleteFromCloudinary = (publicId) => {
//   return new Promise((resolve, reject) => {
//     cloudinary.uploader.destroy(publicId, (error, result) => {
//       if (error) {
//         reject(error);
//       } else {
//         resolve(result);
//       }
//     });
//   });
// };

// /**
//  * Get optimized image URL
//  * @param {string} publicId - Public ID of the image
//  * @param {Object} options - Transformation options
//  * @returns {string} Optimized image URL
//  */
// export const getOptimizedImageUrl = (publicId, options = {}) => {
//   const defaultOptions = {
//     width: 400,
//     height: 300,
//     crop: 'fill',
//     quality: 'auto',
//     format: 'webp'
//   };

//   const transformOptions = { ...defaultOptions, ...options };

//   return cloudinary.url(publicId, transformOptions);
// };

// export default cloudinary;

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (make sure to set these environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Detect media type from file buffer or MIME type
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} mimeType - MIME type of the file
 * @returns {string} - 'image', 'video', or 'auto'
 */
const detectMediaType = (fileBuffer, mimeType) => {
  if (mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
  }
  
  // Fallback: try to detect from buffer headers
  if (fileBuffer && fileBuffer.length > 0) {
    const header = fileBuffer.toString('hex', 0, 12).toUpperCase();
    
    // Video signatures
    if (header.startsWith('000000') && (header.includes('667479706D703432') || header.includes('6674797069736F6D'))) return 'video'; // MP4
    if (header.startsWith('1A45DFA3')) return 'video'; // WebM/MKV
    if (header.startsWith('464C5601')) return 'video'; // FLV
    if (header.startsWith('000001')) return 'video'; // MPEG
    
    // Image signatures
    if (header.startsWith('FFD8FF')) return 'image'; // JPEG
    if (header.startsWith('89504E47')) return 'image'; // PNG
    if (header.startsWith('474946')) return 'image'; // GIF
    if (header.startsWith('52494646') && header.includes('57454250')) return 'image'; // WebP
  }
  
  return 'auto'; // Let Cloudinary auto-detect
};

/**
 * Upload media (image or video) to Cloudinary
 * @param {Buffer} fileBuffer - Media buffer
 * @param {Object} options - Upload options
 * @param {string} options.mimeType - MIME type of the file
 * @param {string} options.resourceType - Override resource type ('image', 'video', 'auto')
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    // Add debug logging
    console.log('uploadToCloudinary called with buffer length:', fileBuffer ? fileBuffer.length : 'No buffer');
    console.log('MIME type:', options.mimeType);
    
    if (!fileBuffer || fileBuffer.length === 0) {
      reject(new Error('Empty file buffer provided to uploadToCloudinary'));
      return;
    }

    // Detect media type
    const resourceType = options.resourceType || detectMediaType(fileBuffer, options.mimeType);
    console.log('Detected resource type:', resourceType);

    // Default options based on media type
    const getDefaultOptions = (type) => {
      const baseOptions = {
        resource_type: type,
        folder: 'reviews',
      };

      if (type === 'image') {
        return {
          ...baseOptions,
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' },
            { format: 'webp' }
          ]
        };
      } else if (type === 'video') {
        return {
          ...baseOptions,
          transformation: [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto' },
            { format: 'mp4' }
          ],
          eager: [
            { width: 640, height: 480, crop: 'pad', format: 'mp4' },
            { width: 1280, height: 720, crop: 'pad', format: 'webm' }
          ]
        };
      } else {
        // Auto-detect
        return {
          ...baseOptions,
          resource_type: 'auto'
        };
      }
    };

    const defaultOptions = getDefaultOptions(resourceType);
    const uploadOptions = { ...defaultOptions, ...options };
    
    // Remove our custom options that Cloudinary doesn't recognize
    delete uploadOptions.mimeType;
    delete uploadOptions.resourceType;

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          console.log('Resource type uploaded:', result.resource_type);
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
};

/**
 * Delete media from Cloudinary
 * @param {string} publicId - Public ID of the media to delete
 * @param {string} resourceType - Resource type ('image', 'video', 'auto')
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = (publicId, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const options = resourceType !== 'auto' ? { resource_type: resourceType } : {};
    
    cloudinary.uploader.destroy(publicId, options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

/**
 * Get optimized media URL
 * @param {string} publicId - Public ID of the media
 * @param {Object} options - Transformation options
 * @param {string} options.resourceType - Resource type ('image', 'video')
 * @returns {string} Optimized media URL
 */
export const getOptimizedMediaUrl = (publicId, options = {}) => {
  const { resourceType = 'image', ...transformOptions } = options;
  
  const getDefaultTransforms = (type) => {
    if (type === 'image') {
      return {
        width: 400,
        height: 300,
        crop: 'fill',
        quality: 'auto',
        format: 'webp'
      };
    } else if (type === 'video') {
      return {
        width: 640,
        height: 480,
        crop: 'fill',
        quality: 'auto',
        format: 'mp4'
      };
    }
    return {};
  };

  const defaultOptions = getDefaultTransforms(resourceType);
  const finalOptions = { 
    ...defaultOptions, 
    ...transformOptions,
    resource_type: resourceType 
  };

  return cloudinary.url(publicId, finalOptions);
};

/**
 * Get video thumbnail URL
 * @param {string} publicId - Public ID of the video
 * @param {Object} options - Transformation options
 * @returns {string} Video thumbnail URL
 */
export const getVideoThumbnail = (publicId, options = {}) => {
  const defaultOptions = {
    resource_type: 'video',
    width: 400,
    height: 300,
    crop: 'fill',
    quality: 'auto',
    format: 'jpg',
    start_offset: '1' // Get thumbnail from 1 second into the video
  };

  const transformOptions = { ...defaultOptions, ...options };

  return cloudinary.url(publicId, transformOptions);
};

/**
 * Check if file is a supported media type
 * @param {string} mimeType - MIME type to check
 * @returns {boolean} True if supported
 */
export const isSupportedMediaType = (mimeType) => {
  const supportedTypes = [
    // Images
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
    'image/svg+xml', 'image/bmp', 'image/tiff',
    // Videos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 
    'video/webm', 'video/x-flv', 'video/3gpp', 'video/x-ms-wmv'
  ];
  
  return supportedTypes.includes(mimeType.toLowerCase());
};

// Backward compatibility - keep the original function name as alias
export const getOptimizedImageUrl = getOptimizedMediaUrl;

export default cloudinary;