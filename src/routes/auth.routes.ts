import express from "express";
import { beWorker, login, logout, Register } from "../controllers/auth.controller";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

// Highlight: multer is needed because Register() uses req.file
// This keeps upload in memory and passes buffer to Cloudinary utils (if it supports it).
const upload = multer({ storage: multer.memoryStorage() });

// @desc Register
router.post("/register", upload.single("image"), Register);

// @desc Login
router.post("/login", login);

// @desc Logout
router.post("/logout", logout);

//! be worker 
router.post("/be-worker", authenticate(), beWorker);

export default router;
