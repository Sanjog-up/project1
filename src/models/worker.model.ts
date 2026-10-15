import mongoose from "mongoose";
import { Role } from "../types/enum.types";
import User from "./user.models";

const documentScheme = new mongoose.Schema(
  {
    path: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  {
    _id: false,
  },
);

const workerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    skills: {
      type: [String],
      lowercase: true,
      trim: true,
      required: [true, "skills is required"],
      validate: {
        validator: (arr: string[]) => arr.length > 0,
        message: "At least one skill is required",
      },
    },
    experience: {
      type: Number,
      required: true,
      min: [0, "experience cannot be negative"],
    },
    bio: {
      type: String,
      required: [true, "bio is required"],
      minlength: [25, "bio must be at least 25 characters long"],
    },
    hourlyRate: {
      type: Number,
      min: [0, "hourlyRate cannot be negative"],
      default: 150,
    },
    serviceRadiusKm: {
      type: Number,
      min: [0, "serviceRadiusKm cannot be negative"],
      default: 10,
    },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    citizenship: {
      type: [documentScheme],
      required: [true, "citizenship documents are required"],
    },
    license: {
      type: documentScheme,
    },
    nid: {
      type: documentScheme,
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords: number[]) => coords.length === 2,
          message: "Coordinates must be an array of two numbers [lng, lat]",
        },
      },
    },
  },
  { timestamps: true },
);

workerSchema.index({ location: "2dsphere" });

//! check user has worker role
workerSchema.pre("save", async function () {
  if (this.isModified("user")) {
    const linkedUser = await User.findById(this.user);
    if (!linkedUser) {
      throw new Error("Linked user not found");
    }
    if (linkedUser.role !== Role.WORKER) {
      throw new Error("Linked user must have a worker role");
    }
  }
});

export const WorkerProfile = mongoose.model("WorkerProfile", workerSchema);
