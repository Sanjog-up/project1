import { NextFunction, Request, Response } from "express";
import User from "../models/user.models";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";

export const getAllUsers = catchAsync(async(req: Request, res:Response, next: NextFunction) => {
    const users = await User.find({});
    sendResponse(res, {
        message: "All users fetched",
        data: users,
        statusCode: 200
    });
});

export const getUsersById = catchAsync(async(req: Request, res:Response, next : NextFunction)=> {
    const { id } = req.params;
    const user = await User.findOne({ _id: id});

    if(!user){
        throw new AppError("User not found", 400)
    }
    
    sendResponse(res, {
        message: `User ${id} fetched`,
        data: user,
        statusCode: 200
    });
})