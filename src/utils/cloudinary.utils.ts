import cloudinary from "../config/cloudinary.config";
import fs from "fs";
import ENV_CONFIG from "../config/env.config";

export const sendFileToCloudinary = async (
  file: Express.Multer.File,
  folder = "/",
  opts: { private?: boolean } = {},
) => {
  try {
    const uploadOptions: Record<string, unknown> = {
      folder: ENV_CONFIG.cloudinary_folder + folder,
    };
    if (opts.private) {
      uploadOptions.type = "authenticated";
    } else {
      uploadOptions.transformation = [
        {
          width: 800,
          crop: "limit",
          fetch_format: "auto",
          quality: "auto",
        },
      ];
    }
    const { public_id, secure_url, format } = await cloudinary.uploader.upload(
      file.path,
      uploadOptions,
    );

    //! delete image from server uploads folder
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return {
      public_id,
      path: secure_url,
      format,
    };
  } catch (error) {
    console.log(error);
    throw error;
  }
};

//! delete file from clodinary
export const deleteFileFromCloudinary = async (
  public_id: string,
  type: "upload" | "authenticated" = "upload",
) => {
  try {
    await cloudinary.uploader.destroy(public_id, { type });
    return true;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
