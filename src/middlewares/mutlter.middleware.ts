import multer from "multer";
import path from "path";
import fs from "fs";
import AppError from "../utils/appError.utils";
import crypto from "crypto";

type UploaderOptions = {
  allowPdf?: boolean;
  maxSizeMB?: number;
};

export const multerUploader = ({
  allowPdf = false,
  maxSizeMB = 10,
}: UploaderOptions) => {
  //! upload folder
  const uploadFolder = path.join(process.cwd(), "uploads");
  const fileSize = maxSizeMB * 1024 * 1024;

  //! create folder if doesnt exists
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
  }

  //! multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadFolder),
    filename: function (req, file, cb) {
      const uniqueName =
        Date.now() + "-" +
        crypto.randomUUID() +
        path.extname(file.originalname);
      cb(null, uniqueName);
    },
  });

  // file filter image: png, jpg, jpeg, webp, svg, pdf, doc image/png
  const allowedExtensions = allowPdf
    ? /^\.(png|jpg|jpeg|webp|pdf)$/
    : /^\.(png|jpg|jpeg|webp)$/;
  const allowedMimeTypes = [
    "image/png",
    "image/jpg",
    "image/jpeg",
    "image/webp",
  ];
  if (allowPdf) {
    allowedMimeTypes.push("application/pdf");
  }

  // virus.exe => file-image.png
  const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
    const extName = allowedExtensions.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const isAllowedMimeType = allowedMimeTypes.includes(file.mimetype);

    if (extName && isAllowedMimeType) {
      cb(null, true);
    } else {
      const error = new AppError(
        `Only image (png, jpg,jpeg and webp) and pdf are allowed`,
        400,
      );
      cb(error);
    }
  };

  //! multer upload api
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: fileSize,
    },
  });
  return upload;
};
