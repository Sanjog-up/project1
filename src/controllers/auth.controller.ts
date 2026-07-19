import jwt from "jsonwebtoken";
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

const folder = "/profile_image";
export const Register = catchAsync(async (req: Request, res: Response) => {
  const { full_name, email, password, phone, role } = req.body;
  const image = req.file;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already registered", 400);
  }
  if (!full_name) {
    throw new AppError("full_name is required", 400);
  }
  if (!email) {
    throw new AppError("email is required", 400);
  }
  if (!password) {
    throw new AppError("password is required", 400);
  }

  const hashedPassword = await hashPassword(password);

  const user = new User({ full_name, email, password:hashedPassword, phone, role});

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

  const token = jwt.sign(
    {
      _id: user._id,
      role: user.role,
      email: user.email,
      full_name: user.full_name,
    },
    ENV_CONFIG.jwt_secret as string,
    { expiresIn: "7d" },
  );

  sendResponse(res, {
    message: "Account created",
    data: { user, token },
    statusCode: 201,
  });
});


//! login
export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    throw new AppError("email is required", 404);
  }
  if (!password) {
    throw new AppError("password is required", 404);
  }

  const user = await User.findOne({ email: email });
  if (!user) {
    throw new AppError("email or password does not matched", 400);
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
  res.cookie("access_token", access_token, {
    httpOnly: ENV_CONFIG.node_env === "development" ? false : true,
    maxAge: parseInt(ENV_CONFIG.cookie_express ?? "7") * 24 * 60 * 60 * 1000,
    secure: ENV_CONFIG.node_env === "development" ? false : true,
    sameSite: ENV_CONFIG.node_env === "development" ? "lax" : "none",
  });
  //* success response
  sendResponse(res, {
    message: "Login successful",
    data: { user, access_token },
    statusCode: 201,
  });
});

//* logout
export const logout = catchAsync(async (req:Request, res:Response) => {
  
  res.clearCookie("access_token", {
    httpOnly: ENV_CONFIG.node_env === "development" ? false : true,
    maxAge: Date.now(),
    secure: ENV_CONFIG.node_env === "development" ? false : true,
    sameSite: ENV_CONFIG.node_env === "development" ? "lax" : "none",
    path: "/",
  });
  sendResponse(res,{
  message: "Logged out successfully",
  statusCode: 200,
  data: null,
  })
})
