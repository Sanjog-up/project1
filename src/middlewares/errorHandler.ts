import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.utils";
import fs from "fs";

export const errorHandler = (
    error: AppError | Error | any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = error?.statusCode || 500;
    let status = statusCode >= 500 ? "error" : error?.status || "fail";
    let message = error?.message || "Internal Server Error";

    if(statusCode >= 500) {
        console.error(error);
    }

    console.log(error.name);
    console.log(error.message);

    //! remove leftover uploads if request failed
    const leftoverFiles = [req.file,
        ...(Array.isArray(req.files) ? req.files : []),
    ].filter(Boolean) as Express.Multer.File[];
    for (const file of leftoverFiles) {
        if(file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
    }

    //! validation error
    if (error.name === "ValidationError") {
        console.log(error);
        statusCode = 422;
        status = "fail";
        message = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", ");
    } 

    //! mongoose error and duplicate key error
    if(error.name === "MongoServerError" && error.code === 11000){
        statusCode = 400;
        status = "fail";
        message = `Duplicate field value entered for ${Object.keys(error.keyValue)}. Please use another value!`;
    }

    //! invalid ObjectId error
    if(error.name === "CastError" || error.kind === "ObjectId"){
        statusCode = 400;
        status = "fail";
        message = `Invalid ${error.path}: ${error.value}.`;
    } 

    if(statusCode >= 500 && process.env.NODE_ENV === "production"){
        message = "Internal Server Error. Please try again later.";
    }

    //* error response
    res.status(statusCode).json({
        status,
        message,
        success: false,
    });
};