"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
//! get all (protected)
router.get("/", auth_middleware_1.protect, user_controller_1.getAllUsers);
//! get by id (protected)
router.get("/:id", auth_middleware_1.protect, user_controller_1.getUsersById);
exports.default = router;
