"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const appError_utils_1 = __importDefault(require("../utils/appError.utils"));
const env_config_1 = __importDefault(require("../config/env.config"));
const signInWithToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_config_1.default.jwt_secret);
        // decoded may include exp. If missing, let it pass.
        if (decoded?.exp && Date.now() >= decoded.exp * 1000) {
            throw new appError_utils_1.default("Token expired", 401);
        }
        const payload = {
            _id: decoded?._id,
            email: decoded?.email,
            full_name: decoded?.full_name,
            role: decoded?.role,
        };
        if (!payload?._id || !payload?.email || !payload?.role) {
            throw new appError_utils_1.default("Invalid token payload", 401);
        }
        return payload;
    }
    catch (err) {
        // normalize
        throw new appError_utils_1.default(err?.message || "Not authorized", 401);
    }
};
const authenticate = (roles) => {
    return (req, res, next) => {
        try {
            const cookieToken = req.cookies?.access_token;
            const authHeader = req.headers.authorization;
            const bearerToken = authHeader?.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : undefined;
            const token = cookieToken || bearerToken;
            if (!token) {
                throw new appError_utils_1.default("Not logged in", 401);
            }
            const payload = signInWithToken(token);
            // role guard
            if (roles?.length) {
                if (!roles.includes(payload.role)) {
                    throw new appError_utils_1.default("Forbidden", 403);
                }
            }
            req.user = {
                _id: payload._id,
                email: payload.email,
                full_name: payload.full_name,
                role: payload.role,
            };
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.authenticate = authenticate;
// Backward compatible alias
exports.protect = (0, exports.authenticate)();
