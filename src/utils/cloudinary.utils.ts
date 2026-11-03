import cloudinary from "../config/cloudinary.config";
import fs from "fs";

export const sendFileToCloudinary = async(file: Express.Multer.File,
    folder = "/",
    opts: { private?: boolean } = {}, 
) => {
    try {
        // const upload_folder = "team_12" + folder;
        const uploadOptions: Record<string, unknown> = { folder: "team_12" + folder};
        if(opts.private){
            uploadOptions.type = "authenticated";
        }
        else {
            uploadOptions.transformation = [{ width: 800, crop: "limit"}];
        }
        const {public_id, secure_url} = await cloudinary.uploader.upload(file.path, uploadOptions);

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