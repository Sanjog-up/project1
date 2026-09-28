import express from "express";
import { beWorker, login, logout, Register } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { multerUploader } from "../middlewares/mutlter.middleware";

const router = express.Router();

const upload = multerUploader();

//! Register
router.post("/register", upload.single("image"), Register);

//! Login
router.post("/login", login);

//! Logout
router.post("/logout", logout);

//! be worker 
router.post("/be-worker", authenticate(), beWorker);

export default router;
