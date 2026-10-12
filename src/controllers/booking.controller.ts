import { Request, Response } from "express";
import { Booking, BookingStatus } from "../models/booking.model";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";
import { Role } from "../types/enum.types";
import mongoose from "mongoose";
import { WorkerProfile } from "../models/worker.model";
import { Service } from "../models/services.model";

const getPagination = (query: Request["query"]) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};
const DEFAULT_RADIUS_KM = 5;
const MAX_RADIUS_KM = 25;
const POOL_LIMIT = 20;
const booking_exp_time = 15;

//! createbooking
export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const { serviceType, description, location, scheduledAt } = req.body ?? {};
  if (req.user!.role !== Role.USER) {
    throw new AppError("Only users can create bookings", 403);
  }
  if (typeof serviceType !== "string" || !serviceType.trim()) {
    throw new AppError("Service type is required ", 400);
  }
  if (typeof location?.address !== "string" || !location.address.trim()) {
    throw new AppError(
      "Missing location.address or address must be a non-empty string",
      400,
    );
  }
  if (
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    throw new AppError(
      "Invalid coordinates. Must be an array of two numbers [lng, lat]",
      400,
    );
  }
  const [lng, lat] = location.coordinates;
  if (typeof lng !== "number" || typeof lat !== "number") {
    throw new AppError("Coordinates must be numbers [lng, lat]", 400);
  }

  if (
    lng < -180 ||
    lng > 180 ||
    lat < -90 ||
    lat > 90 ||
    !Number.isFinite(lng) ||
    !Number.isFinite(lat)
  ) {
    throw new AppError(
      "Longitude must be between -180 and 180, latitude must be between -90 and 90.",
      400,
    );
  }

  if (
    description !== undefined &&
    (typeof description !== "string" || description.trim().length > 300)
  ) {
    throw new AppError(
      "Description must be a string with a maximum length of 300 characters",
      400,
    );
  }

  let scheduledDate: Date | undefined;
  if (scheduledAt) {
    scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
      throw new AppError("Invalid scheduledAt date", 400);
    }
  }

  const expiresAt =
    scheduledDate ?? new Date(Date.now() + booking_exp_time * 60 * 1000); // 15 minutes from now

  const serviceExists = await Service.findOne({
    slug: serviceType.trim().toLowerCase(),
    isActive: true,
  });
  if (!serviceExists) {
    throw new AppError("Service type does not exist or is inactive", 400);
  }  
  const booking = await Booking.create({
    customer: req.user!._id,
    serviceType: serviceExists.slug,
    price: serviceExists.price,
    description,
    location: {
      type: "Point",
      coordinates: [lng, lat],
      address: location.address.trim(),
    },
    scheduledAt: scheduledDate,
    expiresAt,
  });
  sendResponse(res, {
    message: "Booking created successfully",
    data: booking,
    statusCode: 201,
  });
});

//! get available bookings for workers
export const getAvailableBookings = catchAsync(
  async (req: Request, res: Response) => {
    if (req.user!.role !== Role.WORKER) {
      throw new AppError("Only workers can view available bookings", 403);
    }
    const worker = await WorkerProfile.findOne({ user: req.user!._id });
    if (!worker) {
      throw new AppError("Worker profile not found", 404);
    }
    const lng = Number(req.query.lng);
    const lat = Number(req.query.lat);
    if (
      req.query.lng === undefined ||
      req.query.lat === undefined ||
      req.query.lng === null ||
      req.query.lat === null ||
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      throw new AppError("Invalid or missing coordinates", 400);
    }

    const radiusKm = Math.min(
      Math.max(Number(req.query.radius) || DEFAULT_RADIUS_KM, 1),
      MAX_RADIUS_KM,
    );

    const filter: Record<string, unknown> = {
      status: BookingStatus.Requested,
      expiresAt: { $gt: new Date() }, // Only fetch bookings that haven't expired
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiusKm * 1000, // convert km to meters
        },
      },
    };
    const wanted =
      typeof req.query.serviceType === "string"
        ? req.query.serviceType.trim().toLowerCase()
        : undefined;
    filter.serviceType = {
      $in: wanted ? worker.skills.filter((s) => s === wanted) : worker.skills,
    };

    const bookings = await Booking.find(filter)
      .limit(POOL_LIMIT)
      .populate("customer", "full_name")
      .lean();
    sendResponse(res, {
      message: "Available bookings fetched",
      data: { bookings, radiusKm },
      statusCode: 200,
    });
  },
);

//! accept booking
export const acceptBooking = catchAsync(async (req: Request, res: Response) => {
  if (req.user!.role !== Role.WORKER) {
    throw new AppError("Only workers can accept bookings", 403);
  }

  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid booking ID", 400);
  }

  const worker = await WorkerProfile.findOne({ user: req.user!._id });
  if (!worker) {
    throw new AppError("Worker profile not found", 404);
  }
  if (!worker.isAvailable) {
    throw new AppError("You are currently marked as unavailable", 403);
  }

  const booking = await Booking.findOneAndUpdate(
    {
      _id: id,
      status: BookingStatus.Requested,
      expiresAt: { $gt: new Date() },
      serviceType: { $in: worker.skills },
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
      404,
    );
  }
  sendResponse(res, {
    message: "Booking accepted successfully",
    data: booking,
    statusCode: 200,
  });
});

//! booking lifecycle (Accepted -> EnRoute -> InProgress)
const parseId = (id: unknown) => {
  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid booking ID", 400);
  }
  return id;
};
const workerStep = (from: BookingStatus, to: BookingStatus, message: string) =>
  catchAsync(async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const booking = await Booking.findOneAndUpdate(
      { _id: id, worker: req.user!._id, status: from },
      { $set: { status: to } },
      { returnDocument: "after" },
    );
    if (!booking) {
      throw new AppError(
        `Booking not found or it is not in ${from} status`,
        409,
      );
    }
    sendResponse(res, {
      message,
      data: booking,
      statusCode: 200,
    });
  });

export const markEnRoute = workerStep(
  BookingStatus.Accepted,
  BookingStatus.EnRoute,
  "You are on the way",
);
export const startWork = workerStep(
  BookingStatus.EnRoute,
  BookingStatus.InProgress,
  "Work started",
);

//! booking completion
export const completeBooking = catchAsync(
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const booking = await Booking.findOneAndUpdate(
      { _id: id, worker: req.user!._id, status: BookingStatus.InProgress },
      { $set: { status: BookingStatus.Completed, completedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!booking) {
      throw new AppError(
        "Booking not found or it is not in InProgress status",
        409,
      );
    }
    sendResponse(res, {
      message: "Booking completed successfully",
      data: booking,
      statusCode: 200,
    });
  },
);

//! booking release
export const releaseBooking = catchAsync(
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const filter: Record<string, unknown> = {
      _id: id,
      worker: req.user!._id,
      status: { $in: [BookingStatus.Accepted, BookingStatus.EnRoute] },
    };
    const currentBooking = await Booking.findOne(filter);
    if (!currentBooking) {
      throw new AppError(
        "Booking not found or it is not in Accepted or EnRoute status",
        409,
      );
    }
    const expiresAt =
      currentBooking.scheduledAt ??
      new Date(Date.now() + booking_exp_time * 60 * 1000); // 15 minutes from now

    const booking = await Booking.findOneAndUpdate(
      filter,
      {
        $set: { status: BookingStatus.Requested, expiresAt },
        $unset: { worker: 1 },
      },
      { returnDocument: "after" },
    );
    if (!booking) {
      throw new AppError(
        "Booking not found or it is not in Accepted or EnRoute status",
        409,
      );
    }
    sendResponse(res, {
      message: "Booking released successfully",
      data: booking,
      statusCode: 200,
    });
  },
);

//! cancel booking
export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  const cancellationReason =
    typeof req.body?.reason === "string"
      ? req.body.reason.trim().slice(0, 300)
      : undefined;
  const booking = await Booking.findOneAndUpdate(
    {
      _id: id,
      customer: req.user!._id,
      status: { $in: [BookingStatus.Requested, BookingStatus.Accepted] },
    },
    {
      $set: {
        status: BookingStatus.Cancelled,
        cancelledAt: new Date(),
        cancellationReason,
        cancelledBy: "User",
      },
    },
    { returnDocument: "after" },
  );
  if (!booking) {
    throw new AppError(
      "Booking not found or it can no longer be cancelled",
      409,
    );
  }
  sendResponse(res, {
    message: "Booking cancelled successfully",
    data: booking,
    statusCode: 200,
  });
});

//! get my bookings
export const getAllBookings = catchAsync(
  async (req: Request, res: Response) => {
    const me = req.user!._id;
    const { page, limit, skip } = getPagination(req.query);

    const filter: Record<string, unknown> = {
      $or: [{ customer: me }, { worker: me }],
    };
    if (typeof req.query.status === "string") {
      if (
        !Object.values(BookingStatus).includes(
          req.query.status as BookingStatus,
        )
      ) {
        throw new AppError("Invalid status filter", 400);
      }
      filter.status = req.query.status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("customer worker", "full_name +phone")
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

//! expire bookings
export const expireBookings = () => {
  setInterval(async () => {
    try {
      await Booking.updateMany(
        { status: BookingStatus.Requested, expiresAt: { $lte: new Date() } },
        { $set: { status: BookingStatus.Expired } },
      );
    } catch (error) {
      console.error("Error expiring bookings:", error);
    }
  }, 60 * 1000); // Run every minute
};

//! get booking by ID
export const getBookingById = catchAsync(
  async (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    const booking = await Booking.findOne({
      _id: id,
      $or: [{ customer: req.user!._id }, { worker: req.user!._id }],
    })
      .populate("customer worker", "full_name +phone")
      .lean();
    if (!booking) {
      throw new AppError("Booking not found", 404);
    }
    sendResponse(res, {
      message: "Booking fetched successfully",
      data: booking,
      statusCode: 200,
    });
  },
); 