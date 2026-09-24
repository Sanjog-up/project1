import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError.utils";

export const notFoundMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const message = `Can't find ${req.originalUrl} on this server!`;
    next(new AppError(message, 404));
};