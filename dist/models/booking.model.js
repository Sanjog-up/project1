"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Booking = exports.BookingStatus = void 0;
const mongoose_1 = require("mongoose");
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["Requested"] = "Requested";
    BookingStatus["Accepted"] = "Accepted";
    BookingStatus["EnRoute"] = "EnRoute";
    BookingStatus["InProgress"] = "InProgress";
    BookingStatus["Completed"] = "Completed";
    BookingStatus["Cancelled"] = "Cancelled";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
const bookingSchema = new mongoose_1.Schema({
    customer: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    serviceType: { type: String, required: true }, // e.g. "Electrician"
    description: { type: String },
    status: {
        type: String,
        enum: Object.values(BookingStatus),
        default: BookingStatus.Requested,
    },
    location: {
        address: { type: String, required: true },
        coordinates: {
            type: [Number], // [lng, lat]
            required: true,
        },
    },
    scheduledAt: { type: Date },
    price: { type: Number },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Paid", "Refunded"],
        default: "Pending",
    },
}, { timestamps: true });
bookingSchema.index({ location: "2dsphere" });
exports.Booking = (0, mongoose_1.model)("Booking", bookingSchema);
