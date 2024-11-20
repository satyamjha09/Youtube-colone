import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // File has been uploaded successfully
        console.log("File is uploaded on Cloudinary:", response.url);

        return response;

    } catch (error) {
        console.error("Error uploading file:", error);

        try {
            fs.unlinkSync(localFilePath); // Remove the locally saved temporary file
        } catch (err) {
            console.error("Error deleting temporary file:", err);
        }

        return null;
    }
};

export { uploadOnCloudinary };
