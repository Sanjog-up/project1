import express from "express";
import { getAllUsers, getUsersById } from "../controllers/user.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

//! get all (protected)
router.get("/", protect, getAllUsers);

//! get by id (protected)
router.get("/:id", protect, getUsersById);

export default router;
