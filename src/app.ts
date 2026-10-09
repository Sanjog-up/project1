import express from "express";
import { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import AppError from "./utils/appError.utils";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundMiddleware } from "./middlewares/notFound.middleware";
import ENV_CONFIG from "./config/env.config";
import bookingRoutes from "./routes/booking.routes";



const app = express();

if(ENV_CONFIG.node_env === "production") app.set("trust proxy", 1); // trust first proxy

app.use(helmet());
app.use(cookieParser());

app.use(express.json({ limit: "1mb" }));
app.use(cors({ 
  origin: ENV_CONFIG.allow_origin.split(",").map(origin => origin.trim()), 
  credentials: true }));

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
app.use("/api/bookings", bookingRoutes);


//! path not found error middleware
app.use(notFoundMiddleware);

app.use(errorHandler);
export default app;
