"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const multer_1 = __importDefault(require("multer"));
const router = express_1.default.Router();
// Highlight: multer is needed because Register() uses req.file
// This keeps upload in memory and passes buffer to Cloudinary utils (if it supports it).
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// @desc Register
router.post("/register", upload.single("image"), auth_controller_1.Register);
// @desc Login
router.post("/login", auth_controller_1.login);
// @desc Logout
router.post("/logout", auth_controller_1.logout);
exports.default = router;
