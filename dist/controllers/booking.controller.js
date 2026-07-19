"use strict";
// import { Request, Response } from "express";
// import { Booking, BookingStatus } from "../models/booking.model";
// import { catchAsync } from "../utils/catchAsync";
// import { AppError } from "../utils/AppError";
// import { sendResponse } from "../utils/sendResponse";
// // Customer creates a booking request
// export const createBooking = catchAsync(async (req: Request, res: Response) => {
//   const customerId = req.user!.id; // from auth middleware
//   const { worker, serviceType, description, location, scheduledAt } = req.body;
//   if (!worker || !serviceType || !location?.address || !location?.coordinates) {
//     throw new AppError("Missing required booking fields", 400);
//   }
//   const booking = await Booking.create({
//     customer: customerId,
//     worker,
//     serviceType,
//     description,
//     location,
//     scheduledAt,
//   });
//   sendResponse(res, 201, "Booking created successfully", booking);
// });
// // Worker accepts/rejects, or either party updates status
// export const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const { status } = req.body;
//   const userId = req.user!.id;
//   const userRole = req.user!.role;
//   if (!Object.values(BookingStatus).includes(status)) {
//     throw new AppError("Invalid status value", 400);
//   }
//   const booking = await Booking.findById(id);
//   if (!booking) throw new AppError("Booking not found", 404);
//   // Ownership check: only the assigned worker or the customer can update
//   const isWorker = booking.worker.toString() === userId;
//   const isCustomer = booking.customer.toString() === userId;
//   if (!isWorker && !isCustomer && userRole !== "Admin") {
//     throw new AppError("Not authorized to update this booking", 403);
//   }
//   // Basic transition guard (expand later if needed)
//   const workerOnlyTransitions = [BookingStatus.Accepted, BookingStatus.EnRoute, BookingStatus.InProgress, BookingStatus.Completed];
//   if (workerOnlyTransitions.includes(status) && !isWorker && userRole !== "Admin") {
//     throw new AppError("Only the assigned worker can set this status", 403);
//   }
//   if (status === BookingStatus.Cancelled && !isCustomer && !isWorker && userRole !== "Admin") {
//     throw new AppError("Not authorized to cancel", 403);
//   }
//   booking.status = status;
//   await booking.save();
//   sendResponse(res, 200, "Booking status updated", booking);
// });
// // Get bookings for logged-in user (customer sees theirs, worker sees theirs)
// export const getMyBookings = catchAsync(async (req: Request, res: Response) => {
//   const userId = req.user!.id;
//   const userRole = req.user!.role;
//   const filter = userRole === "Worker" ? { worker: userId } : { customer: userId };
//   const bookings = await Booking.find(filter)
//     .populate("customer", "name phone avatar")
//     .populate("worker", "name phone avatar")
//     .sort({ createdAt: -1 });
//   sendResponse(res, 200, "Bookings fetched successfully", bookings);
// });
// // Get single booking detail
// export const getBookingById = catchAsync(async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const booking = await Booking.findById(id)
//     .populate("customer", "name phone avatar")
//     .populate("worker", "name phone avatar");
//   if (!booking) throw new AppError("Booking not found", 404);
//   sendResponse(res, 200, "Booking fetched successfully", booking);
// });
