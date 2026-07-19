"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.Register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const user_models_1 = __importDefault(require("../models/user.models"));
const cloudinary_utils_1 = require("../utils/cloudinary.utils");
const env_config_1 = __importDefault(require("../config/env.config"));
const sendResponse_utils_1 = require("../utils/sendResponse.utils");
const catchAsync_utils_1 = require("../utils/catchAsync.utils");
const bcrypt_utilis_1 = require("../utils/bcrypt.utilis");
const jwt_utilis_1 = require("../utils/jwt.utilis");
const folder = "/profile_image";
exports.Register = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { full_name, email, password, phone, role } = req.body;
    const image = req.file;
    const existingUser = await user_models_1.default.findOne({ email });
    if (existingUser) {
        throw new appError_utils_1.default("Email already registered", 400);
    }
    if (!full_name) {
        throw new appError_utils_1.default("full_name is required", 400);
    }
    if (!email) {
        throw new appError_utils_1.default("email is required", 400);
    }
    if (!password) {
        throw new appError_utils_1.default("password is required", 400);
    }
    const hashedPassword = await (0, bcrypt_utilis_1.hashPassword)(password);
    const user = new user_models_1.default({ full_name, email, password: hashedPassword, phone, role });
    if (image) {
        const { path, public_id } = await (0, cloudinary_utils_1.sendFileToCloudinary)(image, folder);
        user.profile_image = {
            path,
            public_id,
        };
    }
    try {
        await user.save();
    }
    catch (err) {
        if (user.profile_image?.public_id) {
            await (0, cloudinary_utils_1.deleteFileFromCloudinary)(user.profile_image.public_id);
        }
        throw err;
    }
    const token = jsonwebtoken_1.default.sign({
        _id: user._id,
        role: user.role,
        email: user.email,
        full_name: user.full_name,
    }, env_config_1.default.jwt_secret, { expiresIn: "7d" });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Account created",
        data: { user, token },
        statusCode: 201,
    });
});
//! login
exports.login = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        throw new appError_utils_1.default("email is required", 404);
    }
    if (!password) {
        throw new appError_utils_1.default("password is required", 404);
    }
    const user = await user_models_1.default.findOne({ email: email });
    if (!user) {
        throw new appError_utils_1.default("email or password does not matched", 400);
    }
    const isPasswordMathed = await (0, bcrypt_utilis_1.comparePassword)(password, user.password);
    if (!isPasswordMathed) {
        throw new appError_utils_1.default("email or password does not match", 400);
    }
    const payload = {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
    };
    const access_token = (0, jwt_utilis_1.generateJwtToken)(payload);
    //* send access_token in cookie
    res.cookie("access_token", access_token, {
        httpOnly: env_config_1.default.node_env === "development" ? false : true,
        maxAge: parseInt(env_config_1.default.cookie_express ?? "7") * 24 * 60 * 60 * 1000,
        secure: env_config_1.default.node_env === "development" ? false : true,
        sameSite: env_config_1.default.node_env === "development" ? "lax" : "none",
    });
    //* success response
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Login successful",
        data: { user, access_token },
        statusCode: 201,
    });
});
//* logout
exports.logout = (0, catchAsync_utils_1.catchAsync)(async (req, res) => {
    res.clearCookie("access_token", {
        httpOnly: env_config_1.default.node_env === "development" ? false : true,
        maxAge: Date.now(),
        secure: env_config_1.default.node_env === "development" ? false : true,
        sameSite: env_config_1.default.node_env === "development" ? "lax" : "none",
        path: "/",
    });
    (0, sendResponse_utils_1.sendResponse)(res, {
        message: "Logged out successfully",
        statusCode: 200,
        data: null,
    });
});
