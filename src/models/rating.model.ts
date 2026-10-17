import { Schema, model, Types, Document } from "mongoose";

export enum RatedRole {
  WORKER = "Worker",
  CUSTOMER = "User",
}

export interface IRating extends Document {
  booking: Types.ObjectId;
  from: Types.ObjectId;
  to: Types.ObjectId;
  ratedRole: RatedRole;
  score: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ratingSchema = new Schema<IRating>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ratedRole: {
      type: String,
      enum: Object.values(RatedRole),
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: [1, "Score must be atleast 1"],
      max: [5, "Score cant exceed 5"],
    },
    comment: {
      type: String,
      trim: true,
      maxLength: [300, "Comment cant exceed 300 chars."],
    },
  },
  { timestamps: true },
);

ratingSchema.index({booking: 1, from: 1}, {unique: true});
ratingSchema.index({ to: 1, ratedRole: 1});
ratingSchema.index({ booking: 1});

export const Rating = model<IRating>("Rating", ratingSchema);
