"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const app = (0, express_1.default)();
// Highlight: needed because login/logout store JWT in cookies
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, cors_1.default)());
// Health check
app.get("/", (req, res) => {
    res.json({
        message: "server is up and running",
        status: "success",
    });
});
// API routes
// Highlight: these mounts were missing before
app.use("/api/users", user_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
exports.default = app;
