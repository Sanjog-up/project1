import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";
import AppError from "./utils/appError.utils";

const app = express();

// Highlight: needed because login/logout store JWT in cookies
app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(cors());

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

//! error path middleware
app.use((req: Request, res: Response) => {
  const message = `Can't find ${req.originalUrl} on this server!`;
  throw new AppError(message, 404);
});


export default app;
