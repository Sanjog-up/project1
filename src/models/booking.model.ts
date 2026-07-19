import { Schema, model, Types, Document } from "mongoose";

export enum BookingStatus {
  Requested = "Requested",
  Accepted = "Accepted",
  EnRoute = "EnRoute",
  InProgress = "InProgress",
  Completed = "Completed",
  Cancelled = "Cancelled",
}

export interface IBooking extends Document {
  customer: Types.ObjectId;
  worker: Types.ObjectId;
  serviceType: string;
  description?: string;
  status: BookingStatus;
  location: {
    address: string;
    coordinates: [number, number]; // [lng, lat]
  };
  scheduledAt?: Date;
  price?: number;
  paymentStatus: "Pending" | "Paid" | "Refunded";
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
  },
  { timestamps: true }
);

bookingSchema.index({ location: "2dsphere" });

export const Booking = model<IBooking>("Booking", bookingSchema);