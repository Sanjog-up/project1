import { Request, Response } from "express";
import { Booking, BookingStatus } from "../models/booking.model";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";
import mongoose from "mongoose";

export const acceptBooking = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const workerId = req.user!._id;

    const booking = await Booking.findOneAndUpdate({
        _id: id,
        status: BookingStatus.Requested,
    }, 
    {
        $set: {
        status: BookingStatus.Accepted,
        worker: workerId,
    }, 
},{ new: true });

    if(!booking) {
        throw new AppError("Booking not found or not in a state to be accepted", 409);
    }
    sendResponse(res, {
        message: "Booking accepted successfully",
        data: booking,
        statusCode: 200
    });
});