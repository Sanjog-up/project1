"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsersById = exports.getAllUsers = void 0;
const user_models_1 = __importDefault(require("../models/user.models"));
const getAllUsers = async (req, res, next) => {
    try {
        const filter = {};
        const users = await user_models_1.default.find(filter);
        res.status(200).json({
            message: "All users fetched",
            data: users,
            success: true,
            status: "success"
        });
    }
    catch (error) {
        next({
            message: error?.message || "Something went wromg",
            data: null,
            success: false,
            statusCode: error?.statusCode || 500,
        });
    }
};
exports.getAllUsers = getAllUsers;
//! get by id 
const getUsersById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_models_1.default.findOne({ _id: id });
        if (!user) {
            const error = new Error("user not found");
            error.statusCode = 404;
            error.status = "fail";
            throw error;
        }
        res.status(200).json({
            message: `User ${id} fetched`,
            data: user,
            success: true,
            status: "success"
        });
    }
    catch (error) {
        next({
            message: error?.message || "Something went wrong",
            status: error?.status || "error",
            success: false,
            data: null,
            statusCode: error?.statusCode || 500,
        });
    }
};
exports.getUsersById = getUsersById;
