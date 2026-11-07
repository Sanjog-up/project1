import jwt from "jsonwebtoken";
import { Role } from "../types/enum.types";
import mongoose  from "mongoose";
import ENV_CONFIG from "../config/env.config";

 export type TPayload = {
    _id: mongoose.Types.ObjectId;
    full_name?: string;
    role: Role;
    email: string;
};


export type TJwtReturn = { iat:number, exp: number} &TPayload;
//! generate access token
export const generateJwtToken = (payload: TPayload) => {
    try {
        const access_token = jwt.sign(payload, ENV_CONFIG.jwt_secret, {
            expiresIn: ENV_CONFIG.jwt_expiry as any,
        });
        return access_token;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

//! verify token
export const verifyToken = (token: string):TJwtReturn => {
    try {
        return jwt.verify(token, ENV_CONFIG.jwt_secret) as TJwtReturn;
    } catch (error) {
        throw error;
    }
} 