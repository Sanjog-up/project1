import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import AppError from "../utils/appError.utils";
import { Role } from "../types/enum.types";
import { verifyToken } from "../utils/jwt.utils";
import User from "../models/user.models";

export type TAuthedUser = {
  _id: mongoose.Types.ObjectId;
  email: string;
  full_name?: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: TAuthedUser;
    }
  }
}

export const authenticate = (roles?: Role[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith("Bearer ")) throw new AppError("Not logged in", 401);

      let payload;
      try {
        payload = verifyToken(header.split(" ")[1]);
      } catch {
        throw new AppError("Invalid or expired token", 401);
      }

      const user = await User.findById(payload._id).select("email full_name role").lean();
      if (!user) throw new AppError("User no longer exists", 401);
      if (roles?.length && !roles.includes(user.role as Role)) {
        throw new AppError("Forbidden", 403);
      }

      req.user = {
        _id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role as Role,
      };
      next();
    } catch (error) {
      next(error);
    }
  };