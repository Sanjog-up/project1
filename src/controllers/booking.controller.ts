import { Request, Response } from "express";
import { Booking, BookingStatus } from "../models/booking.model";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";
import { Role } from "../types/enum.types";
import mongoose from "mongoose";

const getPagination = (query: Request["query"]) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};
const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 25;
const POOL_LIMIT = 20;

//! createbooking
export const createBooking = catchAsync(async (req: Request, res: Response) => {
  if (req.user!.role !== Role.CLIENT) {
    throw new AppError("Only clients can create bookings", 403);
  }

  const { serviceType, description, location, scheduledAt } = req.body;
  if (!serviceType || !location?.address || !location?.coordinates) {
    throw new AppError(
      "Missing required fields: serviceType, location.address, location.coordinates",
      400,
    );
  }

  const [lng, lat] = location.coordinates;
  if (
    location.coordinates.length !== 2 ||
    typeof lng !== "number" ||
    typeof lat !== "number" ||
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90
  ) {
    throw new AppError(
      "Invalid coordinates. Must be an array of two numbers [lng, lat] with valid ranges.",
      400,
    );
  }

  let scheduledDate: Date | undefined;
  if (scheduledAt) {
    scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate < new Date()) {
      throw new AppError("Invalid scheduledAt date", 400);
    }
  }

  const booking = await Booking.create({
    customer: req.user!._id,
    serviceType,
    description,
    location: {
      type: "Point",
      coordinates: [lng, lat],
      address: location.address,
    },
    scheduledAt: scheduledDate,
  });

  sendResponse(res, {
    message: "Booking created successfully",
    data: booking,
    statusCode: 201,
  });
});

//! accept booking
export const acceptBooking = catchAsync(async (req: Request, res: Response) => {
  if (req.user!.role !== Role.WORKER) {
    throw new AppError("Only workers can accept bookings", 403);
  }

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid booking ID", 400);
  }

  const booking = await Booking.findOneAndUpdate(
    {
      _id: id,
      status: BookingStatus.Requested,
    },
    {
      $set: {
        status: BookingStatus.Accepted,
        worker: req.user!._id,
      },
    },
    { returnDocument: "after" },
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

//! get available bookings for workers
export const getAvailableBookings = catchAsync(async (req: Request, res: Response) => {
    if (req.user!.role !== Role.WORKER) {
      throw new AppError("Only workers can view available bookings", 403);
    }
    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    if(
      req.query.lng === undefined || req.query.lat === undefined ||
      req.query.lng === null || req.query.lat === null ||
      !Number.isFinite(lng) || !Number.isFinite(lat) ||
      lng < -180 || lng > 180 || lat < -90 || lat > 90
    ) {
      throw new AppError("Invalid or missing coordinates", 400);
    }

    const radiusKm = Math.min(
      Math.max(Number(req.query.radius) || DEFAULT_RADIUS_KM, 1),
      MAX_RADIUS_KM,
    );

    const filter: Record<string, unknown> = { 
      status: BookingStatus.Requested,
    location: {
      $near:{
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000, // convert km to meters
      },
    },
    };
    if (typeof req.query.serviceType === "string") {
      filter.serviceType = req.query.serviceType;
    }

    const bookings = await Booking.find(filter)
    .limit(POOL_LIMIT)
    .populate("customer", "name ")
    .lean();
    sendResponse(res, {
      message: "Available bookings fetched",
      data: { bookings, radiusKm },
      statusCode: 200,
    });
  },
);

//! get my bookings 
export const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const role = req.user!.role;
    const { page, limit, skip } = getPagination(req.query);

    let filter: Record<string, unknown>;
    if (role === Role.WORKER) filter = { worker: userId };
    else if (role === Role.CLIENT) filter = { customer: userId };
    else throw new AppError("Unauthorized role for fetching bookings", 403);

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
        .skip(skip)
        .limit(limit)
        .populate("customer worker", "name phone")
        .lean(),
      Booking.countDocuments(filter),
    ]);

    sendResponse(res, {
      message: "All bookings fetched",
      data: { bookings, total, page, pages: Math.ceil(total / limit) },
      statusCode: 200,
    });
  },
);