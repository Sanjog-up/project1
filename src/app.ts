import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

// Highlight: needed because login/logout store JWT in cookies
app.use(cookieParser());

app.use(express.json({ limit: "10mb" }));
app.use(cors());

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "server is up and running",
    status: "success",
  });
});

// API routes
// Highlight: these mounts were missing before
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

export default app;
