import { comparePassword } from './../utils/bcrypt.utilis';
import {Document} from 'mongoose';
import { Role } from './../types/enum.types';
import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

// interface IUser extends Document{
//   full_name: string,
//   email:string;
//   password:string,
//   phone?: string,
//   role: string,
//   profile_image?: {
//     path: string,
//     public_id: string,
//   },
//   comparePassword(candidatePassword: string): Promise<boolean>;
// }

const userSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "full_name is required"],
      minLength: [3, "Name must be 3 char. long"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [6, "password must be 6 char. long"],
    },
    phone: {
      type: String,
      select:false,
      minLength: [10, "phone must be 10 digits"],
    },
    //! role
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
  
  //! profile image:{path: ``,public_id:``}
  profile_image:{
    type: {
      path:{
        type: String,
        required: true,
      },
      public_id: {
        type: String,
        required: true,
      },
    }
  } ,
  },
  { timestamps: true },
)

const User = mongoose.model("User", userSchema);
export default User;