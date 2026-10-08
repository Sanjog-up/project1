import { Response, Request, NextFunction } from "express";
import AppError from "../utils/appError.utils";
import User from "../models/user.models";
import {
  deleteFileFromCloudinary,
  sendFileToCloudinary,
} from "../utils/cloudinary.utils";
import ENV_CONFIG from "../config/env.config";
import { sendResponse } from "../utils/sendResponse.utils";
import { catchAsync } from "../utils/catchAsync.utils";
import { comparePassword, hashPassword } from "../utils/bcrypt.utilis";
import { generateJwtToken } from "../utils/jwt.utilis";
import { WorkerProfile } from "../models/worker.model";
import { Role } from "../types/enum.types";

const cookieOptions = () => {
  const dev = ENV_CONFIG.node_env === "development";
  return {
    httpOnly: !dev,
    secure: !dev,
    sameSite: (dev ? "lax" : "none") as "lax" | "none",
    path: "/",
  };
};

const setAuthCookie = (res: Response, token: string) =>
  res.cookie("access_token", token, {
    ...cookieOptions(),
    maxAge: parseInt(ENV_CONFIG.cookie_express ?? "7") * 24 * 60 * 60 * 1000,
  });

const clearAuthCookie = (res: Response) =>
  res.clearCookie("access_token", cookieOptions());

const folder = "/profile_image";
export const Register = catchAsync(async (req: Request, res: Response) => {
  const { full_name, email, password, phone } = req.body;
  const image = req.file;
  if (!full_name || typeof full_name !== "string" || full_name.trim().length < 3) {
    throw new AppError("full_name is required and must be at least 3 characters long", 400);
  }
  if (!email || typeof email !== "string") {
    throw new AppError("email is required", 400);
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new AppError("password is required and must be at least 6 characters long", 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError("please provide a valid email address", 400);
  }
  const loweredEmail = email.toLowerCase();

  const existingUser = await User.findOne({
    email: loweredEmail.toLowerCase(),
  });
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }

  const hashedPassword = await hashPassword(password);

  const user = new User({
    full_name,
    email: loweredEmail,
    password: hashedPassword,
    phone,
    role: Role.USER,
  });

  if (image) {
    const { path, public_id } = await sendFileToCloudinary(image, folder);
    user.profile_image = {
      path,
      public_id,
    };
  }
  try {
    await user.save();
  } catch (err) {
    if (user.profile_image?.public_id) {
      await deleteFileFromCloudinary(user.profile_image.public_id);
    }
    throw err;
  }

  const access_token = generateJwtToken({
    _id: user._id,
    role: user.role,
    email: user.email,
    full_name: user.full_name,
  });
  setAuthCookie(res, access_token);

  sendResponse(res, {
    message: "Account created",
    data: { user, access_token },
    statusCode: 201,
  });
});

//! login
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || !email) {
    throw new AppError("email is required", 400);
  }
  if (!password || typeof password !== "string") {
    throw new AppError("password is required", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user) {
    throw new AppError("email or password does not match", 400);
  }

  const isPasswordMathed = await comparePassword(password, user.password);

  if (!isPasswordMathed) {
    throw new AppError("email or password does not match", 400);
  }

  const payload = {
    _id: user._id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
  };

  const access_token = generateJwtToken(payload);

  //* send access_token in cookie
  setAuthCookie(res, access_token);
  //* success response
  sendResponse(res, {
    message: "Login successful",
    data: { user, access_token },
    statusCode: 201,
  });
});

//! logout
export const logout = catchAsync(async (req: Request, res: Response) => {
  clearAuthCookie(res);
  sendResponse(res, {
    message: "Logged out successfully",
    statusCode: 200,
    data: null,
  });
});

//! sign up as worker
export const beWorker = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!._id;

  if (req.user!.role === Role.USER) {
    throw new AppError("Only users can be registered as worker", 400);
  }

  //* checking user has worjer profile
  const existing = await WorkerProfile.findOne({ user: userId });
  if (existing) {
    throw new AppError("You are already registered as worker", 400);
  }

  const { skills, experience, bio, hourlyRate, serviceRadiusKm, location } =
    req.body;

  if (!Array.isArray(skills) || skills.length === 0) {
    throw new AppError("skills must be a non-empty array", 400);
  }
  if (!bio || bio.length < 25) {
    throw new AppError(
      "bio is required and must be at least 25 characters long",
      400,
    );
  }
  const coords = location?.coordinates;
  if (
    !Array.isArray(coords) ||
    coords.length !== 2 ||
    !coords.every(
      (c: unknown) => typeof c === "number" && Number.isFinite(c),
    ) ||
    Math.abs(coords[0]) > 180 ||
    Math.abs(coords[1]) > 90
  ) {
    throw new AppError(
      "location must be provided with valid coordinates [lng, lat]",
      400,
    );
  }

  await User.findByIdAndUpdate(
    userId,
    { role: Role.WORKER },
    { runValidators: true },
  );

  let workerProfile;
  try {
    workerProfile = await WorkerProfile.create({
      user: userId,
      skills,
      experience: experience || 0,
      bio,
      hourlyRate: hourlyRate || 150,
      serviceRadiusKm: serviceRadiusKm || 10,
      location: {
        type: "Point",
        coordinates: coords,
      },
    });
  } catch (err) {
    await User.findByIdAndUpdate(userId, { role: Role.USER });
    throw err;
  }

  sendResponse(res, {
    message: "Successfully registered as worker",
    data: workerProfile,
    statusCode: 201,
  });
});
