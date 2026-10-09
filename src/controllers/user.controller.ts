import { NextFunction, Request, Response } from "express";
import User from "../models/user.models";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";
import mongoose from "mongoose";

export const getAllUsers = catchAsync(async(req: Request, res:Response, next: NextFunction) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        User.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
        User.countDocuments()
    ]);
    sendResponse(res, {
        message: "All users fetched",
        data: {users, total, page, pages: Math.ceil(total / limit)},
        statusCode: 200
    });
});

export const getUsersById = catchAsync(async(req: Request, res:Response, next : NextFunction)=> {
    const { id } = req.params;
    if(!mongoose.isValidObjectId(id)){
        throw new AppError("Invalid user id", 400);
    }
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