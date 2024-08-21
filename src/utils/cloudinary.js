import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import dotenv from "dotenv"

dotenv.config({ path: ".env" });  // Load environment variables from.env file

 // Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder: "skool",
            resource_type: "auto",
        })
        // file uploaded on cloudinary
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)    // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

// Function to delete an image
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return null

    // delete the image from cloudinary
    const deleteResponse = await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
            console.log('Error deleting image:', error);
        }
        console.log(result)
    });
    
    return deleteResponse;
}

export { uploadOnCloudinary, deleteFromCloudinary }