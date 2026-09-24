import express from "express";
import { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import AppError from "./utils/appError.utils";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import ENV_CONFIG from "./config/env.config";

const app = express();

// Highlight: needed because login/logout store JWT in cookies
app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(cors({ origin: ENV_CONFIG.allow_origin, credentials: true }));

// Health check
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "server is up and running",
    status: "success",
    success: true,
  });
});

// API routes
// Highlight: these mounts were missing before
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

//! path not found error middleware
app.use(notFoundMiddleware);

app.use(errorHandler);
export default app;
