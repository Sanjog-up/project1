"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const enum_types_1 = require("./../types/enum.types");
const mongoose_1 = __importDefault(require("mongoose"));
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
const userSchema = new mongoose_1.default.Schema({
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
        select: false,
        minLength: [10, "phone must be 10 digits"],
    },
    //! role
    role: {
        type: String,
        enum: Object.values(enum_types_1.Role),
        default: enum_types_1.Role.USER,
    },
    //! profile image:{path: ``,public_id:``}
    profile_image: {
        type: {
            path: {
                type: String,
                required: true,
            },
            public_id: {
                type: String,
                required: true,
            },
        }
    },
}, { timestamps: true });
const User = mongoose_1.default.model("User", userSchema);
exports.default = User;
