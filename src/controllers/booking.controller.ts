import { Request, Response } from "express";
import { Booking, BookingStatus } from "../models/booking.model";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";
import { Role } from "../types/enum.types";
import mongoose from "mongoose";

//! createbooking
export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const { serviceType, description, location, scheduledAt } = req.body;
  const customerId = req.user!._id;

  if (!serviceType || !location?.address || !location?.coordinates) {
    throw new AppError(
      "Missing required fields: serviceType, location.address, location.coordinates",
      400,
    );
  }
  const booking = await Booking.create({
    customer: customerId,
    serviceType,
    description,
    location,
    scheduledAt,
  });
  sendResponse(res, {
    message: "Booking created successfully",
    data: booking,
    statusCode: 201,
  });
});

export const acceptBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const workerId = req.user!._id;

  const booking = await Booking.findOneAndUpdate(
    {
      _id: id,
      status: BookingStatus.Requested,
    },
    {
      $set: {
        status: BookingStatus.Accepted,
        worker: workerId,
      },
    },
    { new: true },
  );
  if (!booking) {
    throw new AppError(
      "Booking not found or not in a state to be accepted",
      409,
    );
  }
  sendResponse(res, {
    message: "Booking accepted successfully",
    data: booking,
    statusCode: 200,
  });
});

//! get all bookings
export const getAllBookings = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const role = req.user!.role;
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.max(Number(req.query.limit) || 10, 50);

    const filter: Record<string, unknown> =
      role === Role.WORKER ? { worker: userId } : { customer: userId };

    const status = req.query.status as string | undefined;
    if (status) {
      if (!Object.values(BookingStatus).includes(status as BookingStatus)) {
        throw new AppError("Invalid status filter", 400);
      }
      filter.status = status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("customer worker", "name phone")
        .lean(),
      Booking.countDocuments(filter),
    ]);
    
    sendResponse(res, {
      message: "All bookings fetched",
      data: {bookings, total, page, pages: Math.ceil(total / limit)},
      statusCode: 200,
    });
  },
);
