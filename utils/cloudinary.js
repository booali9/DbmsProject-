const cloudinary = require('cloudinary').v2;
const fs = require('fs');

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

exports.uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'canteen_bills',
      resource_type: 'auto'
    });
    
    // Delete file from local storage after upload
    fs.unlinkSync(filePath);
    
    return result;
  } catch (error) {
    throw error;
  }
};