import express from "express";
import { createBooking, acceptBooking, getAllBookings, getAvailableBookings } from "../controllers/booking.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Role } from "../types/enum.types";

const router = express.Router();

//! create booking (authenticated)
router.post("/", authenticate([Role.USER]), createBooking);

//! accept booking
router.patch("/:id/accept", authenticate([Role.WORKER]), acceptBooking);

//! get all bookings for client (authenticated)
router.get("/", authenticate([Role.USER, Role.WORKER]), getAllBookings); 

//! get available bookings for workers
router.get("/available", authenticate([Role.WORKER]), getAvailableBookings);

export default router;