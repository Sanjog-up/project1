import { Request, Response } from "express"
import { Role } from "../types/enum.types"
import AppError from "../utils/appError.utils"
import { catchAsync } from "../utils/catchAsync.utils"
import { WorkerProfile } from "../models/worker.model"
import { sendResponse } from "../utils/sendResponse.utils"

export const setAvailability = catchAsync(async(req:Request,res: Response ) => {
    if(req.user!.role !== Role.WORKER){
        throw new AppError("Only workers can update availablity", 403);
    }
    const { isAvailable } = req.body;
    if(typeof isAvailable !== "boolean"){
        throw new AppError ("isAvailable must be boolean", 400);
    }
    const worker = await WorkerProfile.findOneAndUpdate(
        {user: req.user!._id},
        {$set: { isAvailable}},
        {returnDocument: "after"}
    )
    if(!worker) throw new AppError("Worker profile not found", 404);
    sendResponse(res, {
        message: "Availability updated",
        data: worker, statusCode: 200
    })
})