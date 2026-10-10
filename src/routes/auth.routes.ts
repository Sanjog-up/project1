import express from "express";
import { beWorker, login, logout, Register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { multerUploader } from "../middlewares/mutlter.middleware";
import  rateLimit  from "express-rate-limit";

const router = express.Router();

const upload = multerUploader({ allowPdf: false, maxSizeMB: 5 });
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit : 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: "{ status: fail, success: false, message: Too many requests from this IP, please try again after 15 minutes }",
});

//! Register
router.post("/register", authLimiter, upload.single("image"), Register);

//! Login
router.post("/login", authLimiter, login);

//! Logout
router.post("/logout", logout);

//! be worker 
router.post("/be-worker", authenticate(), beWorker);

export default router;
