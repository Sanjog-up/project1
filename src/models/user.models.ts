import { Role } from './../types/enum.types';
import mongoose from "mongoose";


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
      select: false,
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
  { timestamps: true ,
    toJSON: { 
      transform: (_doc, ret: any) => {
        const { password, ...safeRet } = ret;
        return safeRet;
      },
    },
  },
)

const User = mongoose.model("User", userSchema);
export default User;