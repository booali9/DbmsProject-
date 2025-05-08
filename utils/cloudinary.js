// const cloudinary = require('cloudinary').v2;
// const fs = require('fs');
// const dotenv = require("dotenv");

// dotenv.config();

// cloudinary.config({ 
//   cloud_name:'dd4dfeok2', 
//   api_key: '333798116394897', 
//   api_secret:'dkHbWF6GnQsu-VWiuvcEIQyWJuo' 
// });

// exports.uploadToCloudinary = async (filePath) => {
//   try {
//     const result = await cloudinary.uploader.upload(filePath, {
//       folder: 'canteen_bills',
//       resource_type: 'auto'
//     });
    
//     // Delete file from local storage after upload
//     fs.unlinkSync(filePath);
    
//     return result;
//   } catch (error) {
//     throw error;
//   }
// };

const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const { Readable } = require('stream');

dotenv.config();

// Configure cloudinary with your credentials
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Function to upload buffer to cloudinary
exports.uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'canteen_bills' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    
    // Create stream from buffer and pipe to cloudinary
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
};