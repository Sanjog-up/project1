import { Role } from "../types/enum.types";
import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    skills: {
        type: [String],
        required: [true, "skills is required"],
    },
    hourlyRate: {type: Number},
    serviceRadiusKm: {type: Number},
    isVerified: { type: Boolean, default: false},
    isAvailable: { type: Boolean, default: true},
    rating : { type: Number, default: 0},
    location: {
        type: { type: String, enum: ["Point"], default: "Point"},
        coordinates: { type: [Number], required: true},
    },
}, {timestamps: true});

workerSchema.index({ location: "2dsphere"});

export const WorkerProfile = mongoose.model("WorkerProfile", workerSchema);