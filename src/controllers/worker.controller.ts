import { Request, Response } from "express";
import { Role } from "../types/enum.types";
import AppError from "../utils/appError.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import { WorkerProfile } from "../models/worker.model";
import { sendResponse } from "../utils/sendResponse.utils";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.config";
import { worker } from "node:cluster";

export const setAvailability = catchAsync(
  async (req: Request, res: Response) => {
    if (req.user!.role !== Role.WORKER) {
      throw new AppError("Only workers can update availablity", 403);
    }
    const { isAvailable } = req.body;
    if (typeof isAvailable !== "boolean") {
      throw new AppError("isAvailable must be boolean", 400);
    }
    const worker = await WorkerProfile.findOneAndUpdate(
      { user: req.user!._id },
      { $set: { isAvailable } },
      { returnDocument: "after" },
    );
    if (!worker) throw new AppError("Worker profile not found", 404);
    sendResponse(res, {
      message: "Availability updated",
      data: worker,
      statusCode: 200,
    });
  },
);

export const verifyWorker = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
    throw new AppError("Invalid worker id", 400);
  }
  const worker = await WorkerProfile.findByIdAndUpdate(
    id,
    { $set: { isVerified: true } },
    { returnDocument: "after" },
  );
  if (!worker) throw new AppError("Worker profile not found", 404);
  sendResponse(res, {
    message: "Worker verified",
    data: worker,
    statusCode: 200,
  });
});

export const getWorkerDocuments = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string" || !mongoose.isValidObjectId(id)) {
      throw new AppError("Invalid worker id", 400);
    }
    const worker = await WorkerProfile.findById(id)
      .select("+citizenshipFront + citizenshipBack +license +nid")
      .lean();
    if (!worker) throw new AppError("Worker profile not found", 400);

    const expires_at = Math.floor(Date.now() / 1000) + 30 * 60;

    const makeLink = (
      doc?: { public_id: string; format?: string | null } | null,
    ) =>
      doc
        ? cloudinary.utils.private_download_url(
            doc.public_id,
            doc.format ?? "jpg",
            {
              type: "authenticated",
              resource_type: "image",
              expires_at,
            },
          )
        : null;

    sendResponse(res, {
      message: "Document links (valid for 30 mins)",
      data: {
        citizenshipFront: makeLink(worker.citizenshipFront),
        citizenshipBack: makeLink(worker.citizenshipBack),
        license: makeLink(worker.license),
        nid: makeLink(worker.nid),
      },
      statusCode: 200,
    });
  },
);

export const listPendingWorkers = catchAsync(
  async (_req: Request, res: Response) => {
    const workers = await WorkerProfile.find({ isVerified: false })
      .select("skills bio experience createAt")
      .populate("user", "full_name email")
      .lean();
    sendResponse(res, {
      message: "Pending workers",
      data: workers,
      statusCode: 200,
    });
  },
);
