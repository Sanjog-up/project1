import cloudinary from "../config/cloudinary.config";
import fs from "fs";

export const sendFileToCloudinary = async(file: Express.Multer.File,
    folder = "/"
) => {
    try {
        const upload_folder = "team_12" + folder;
        const {public_id, secure_url} = await cloudinary.uploader.upload(file.path,{
            
                folder: upload_folder,
                transformation: [{
                    width: 800,
                    crop: "scale",
                    fetch_format: "auto",
                    quality: "auto",
                },
            ],
            },
        );

        //! delete image from server uploads folder
        if(fs.existsSync(file.path)){
            fs.unlinkSync(file.path);
        }
        return {
            public_id,
            path: secure_url,
        }
    
    } catch (error) {
        console.log(error);
        throw error;
    }
};

//! delete file from clodinary
export const deleteFileFromCloudinary = async (public_id: string)=>{
    try {
        await cloudinary.uploader.destroy(public_id);
        return true;
    } catch (error) {
        console.log(error);
        throw error;
    }
} 