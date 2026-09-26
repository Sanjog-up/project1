import express from "express";
import { createBooking, acceptBooking } from "../controllers/booking.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Role } from "../types/enum.types";

const router = express.Router();

//! create booking (authenticated)
router.post("/", authenticate([Role.CLIENT]), createBooking);

//! accept booking
router.patch("/:id/accept", authenticate([Role.WORKER]), acceptBooking);

export default router;