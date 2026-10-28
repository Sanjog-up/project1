import { Schema, model, Types, Document, HydratedDocument } from "mongoose";
import AppError from "../utils/appError.utils";

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

export type RatingDocument = HydratedDocument<IRating>

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
      validate: {
        validator: Number.isInteger,
        message: "Score must be a whole number"
      }
    },
    comment: {
      type: String,
      trim: true,
      maxLength: [300, "Comment cant exceed 300 chars."],
    },
  },
  { timestamps: true },
);

// stop selfrating
ratingSchema.pre("validate", function(){
  if(this.from && this.to && this.from.equals(this.to)){
    throw new AppError("You cant rate yourself", 400);
  }
});
      

ratingSchema.index({booking: 1, from: 1}, {unique: true});
ratingSchema.index({ to: 1, ratedRole: 1});

export const Rating = model<IRating>("Rating", ratingSchema);
