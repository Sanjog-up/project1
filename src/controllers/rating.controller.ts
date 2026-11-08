import { Request, Response } from "express";
import mongoose from "mongoose";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";
import { Rating, RatedRole } from "../models/rating.model";
import { Booking, BookingStatus } from "../models/booking.model";
import { WorkerProfile } from "../models/worker.model";
import { Role } from "../types/enum.types";

export const createRating = catchAsync(async (req: Request, res: Response) => {
  const { bookingId, score, comment } = req.body ?? {};
  const me = req.user!._id;

  if (!mongoose.isValidObjectId(bookingId)) {
    throw new AppError("Invalid booking id", 400);
  }
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new AppError("score must be as integer bet 1 and 5", 400);
  }
  if (
    comment !== undefined &&
    (typeof comment !== "string" || comment.trim().length > 300)
  ) {
    throw new AppError("comment must be a string max 300 chars", 400);
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError("Booking not found", 404);
  if (booking.status !== BookingStatus.Completed) {
    throw new AppError("You can only rate completed bookings", 400);
  }

  const isCustomer = String(booking.customer) === String(me);
  const isWorker = booking.worker && String(booking.worker) === String(me);

  if (!isCustomer && !isWorker) {
    throw new AppError("You are not part of this booking", 403);
  }

  // Customer rates worker; worker rates customer
  const to = isCustomer ? booking.worker : booking.customer;
  const ratedRole = isCustomer ? RatedRole.WORKER : RatedRole.CUSTOMER;

  if (!to) throw new AppError("No one to rate on this booking", 400);

  const existing = await Rating.findOne({ booking: bookingId, from: me });
  if (existing) throw new AppError("You already rated this booking", 409);

  const rating = await Rating.create({
    booking: bookingId,
    from: me,
    to,
    ratedRole,
    score,
    comment: typeof comment === "string" ? comment.trim() : undefined,
  });

  // Update worker profile average when a worker is rated
  if (ratedRole === RatedRole.WORKER) {
    const stats = await Rating.aggregate([
      { $match: { to: to, ratedRole: RatedRole.WORKER } },
      {
        $group: {
          _id: "$to",
          avg: { $avg: "$score" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats[0]) {
      await WorkerProfile.findOneAndUpdate(
        { user: to },
        {
          $set: {
            rating: Math.round(stats[0].avg * 10) / 10,
            ratingCount: stats[0].count,
          },
        },
      );
    }
  }

  sendResponse(res, {
    message: "Rating submitted",
    data: rating,
    statusCode: 201,
  });
});


export const getRatingsForUser = catchAsync(async(req: Request, res: Response) => {
    const { userId } = req.params;
    if(!mongoose.isValidObjectId(userId)){
        throw new AppError("invalid userId", 400)
    }

    const ratings = await Rating.find({ to: userId})
    .sort({ createdAt: -1})
    .limit(50)
    .populate("from", "full_name")
    .lean();

    sendResponse(res, {
        message: "Ratings fetched",
        data: ratings,
        statusCode: 200
    })
})