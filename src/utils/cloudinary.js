import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



cloudinary.config({
  cloud_name: 'dqx2d9iit',
  api_key: '662585541234979',
  api_secret: 'bqZ8C-qZpy4yyrNnFf1BOVBn0Xc',
});

console.log("Cloudinary Config:", {
    cloud_name: 'dqx2d9iit',
  api_key: '662585541234979',
  api_secret: 'bqZ8C-qZpy4yyrNnFf1BOVBn0Xc',
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });
    console.log("File is uploaded on Cloudinary:", response.url);
    return response;
  } catch (error) {
    console.error("Error uploading file:", error);
    try {
      fs.unlinkSync(localFilePath);  // Remove the locally saved temporary file
    } catch (err) {
      console.error("Error deleting temporary file:", err);
    }
    return null;
  }
};

export { uploadOnCloudinary };
