import express from "express";
import { getAllUsers, getUsersById } from "../controllers/user.controller";
import { authenticate, protect } from "../middlewares/auth.middleware";
import { Role } from "../types/enum.types";

const router = express.Router();

//! get all (protected)
router.get("/", authenticate([Role.ADMIN]), getAllUsers);

//! get by id (protected)
router.get("/:id", authenticate([Role.ADMIN]), getUsersById);

export default router;
