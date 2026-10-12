import { Schema, model } from "mongoose";

const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, maxlength: 200, trim: true },
    price: { type: Number, required: true, min: [1, "Price must be at least 1"] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Service = model("Service", serviceSchema);