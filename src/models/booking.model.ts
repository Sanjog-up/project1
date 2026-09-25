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
    serviceType: { type: String, required: true, trim: true }, // e.g. "Electrician"
    description: { type: String, trim: true },
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
        validate: {
          validator: (coords: number[]) => coords.length === 2,
          message: "Coordinates must be an array of two numbers [lng, lat]",
        }
      },
    },
    scheduledAt: { type: Date },
    price: { type: Number, min: [0, "Price cannot be negative"] },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

bookingSchema.index({ location: "2dsphere" });
bookingSchema.index({ customer: 1, worker: 1, scheduledAt: 1 }, { unique: true });  
bookingSchema.index({ worker: 1, status: 1, scheduledAt: 1 });
export const Booking = model<IBooking>("Booking", bookingSchema);