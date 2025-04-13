const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({ 
  cloud_name:'dd4dfeok2', 
  api_key: '333798116394897', 
  api_secret:'dkHbWF6GnQsu-VWiuvcEIQyWJuo' 
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