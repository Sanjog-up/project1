import express from "express";
import { createBooking, acceptBooking, getAllBookings, getAvailableBookings, getBookingById, markEnRoute, cancelBooking, completeBooking,  releaseBooking } from "../controllers/booking.controller";
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

//! get booking by ID
router.get("/:id", authenticate([Role.USER, Role.WORKER]), getBookingById);

//! mark booking as en route
router.patch("/:id/en-route", authenticate([Role.WORKER]), markEnRoute);

//! cancel booking
router.patch("/:id/cancel", authenticate([Role.USER]), cancelBooking);

//! complete booking
router.patch("/:id/complete", authenticate([Role.WORKER]), completeBooking);

//! release booking
router.patch("/:id/release", authenticate([Role.WORKER]), releaseBooking);

export default router;