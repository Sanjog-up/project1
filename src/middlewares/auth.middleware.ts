import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.utils";
import ENV_CONFIG from "../config/env.config";
import { Role } from "../types/enum.types";
import mongoose from "mongoose";

export type TAuthedUser = {
  _id: mongoose.Types.ObjectId;
  email: string;
  full_name?: string;
  role: Role;
};

export type TPayload = {
  _id: mongoose.Types.ObjectId;
  full_name?: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: TAuthedUser;
    }
  }
}

const signInWithToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, ENV_CONFIG.jwt_secret as string) as any;

    // decoded may include exp. If missing, let it pass.
    if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
      throw new AppError("Token expired", 401);
    }

    const payload: TPayload = {
      _id: decoded?._id,
      email: decoded?.email,
      full_name: decoded?.full_name,
      role: decoded?.role,
    };

    if (!payload?._id || !payload?.email || !payload?.role) {
      throw new AppError("Invalid token payload", 401);
    }

    return payload;
  } catch (err: any) {
    // normalize
    throw new AppError(err?.message || "Not authorized", 401);
  }
};

export const authenticate = (roles?: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookieToken = req.cookies?.access_token;
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;

      const token = cookieToken || bearerToken;
      if (!token) {
        throw new AppError("Not logged in", 401);
      }

      const payload = signInWithToken(token);

      // role guard
      if (roles?.length) {
        if (!roles.includes(payload.role)) {
          throw new AppError("Forbidden", 403);
        }
      }

      req.user = {
        _id: payload._id,
        email: payload.email,
        full_name: payload.full_name,
        role: payload.role,
      };

      next();
    } catch (error: any) {
      next(error);
    }
  };
};

// Backward compatible alias
export const protect = authenticate();
