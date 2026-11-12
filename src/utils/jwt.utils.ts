import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import ENV_CONFIG from "../config/env.config";

//! generate access token
export const generateJwtToken = (userId: string | mongoose.Types.ObjectId) => 
  jwt.sign({ _id: String(userId)}, ENV_CONFIG.jwt_secret, {
    algorithm: "HS256",
    expiresIn: ENV_CONFIG.jwt_expiry as any,
  });

//! verify token
export const verifyToken = (token: string)=> {
    return jwt.verify(token, ENV_CONFIG.jwt_secret, {
        algorithms: ["HS256"],
    }) as {
        _id: string;
        iat: number;
        exp: number;
    }
};
