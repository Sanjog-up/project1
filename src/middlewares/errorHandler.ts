import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.utils";

export const errorHandler = (
    error: AppError | Error | any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = error?.statusCode || 500;
    let status = error?.status || "error";
    let message = error?.message || "Internal Server Error";

    console.log(error.name);
    console.log(error.message);

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

    //* error response
    res.status(statusCode).json({
        status,
        message,
        success: false,
    });
}; 
    
