import { Response } from "express"

type TResponse<T> = {
    message: string;
    data?: T;
    statusCode: number;
    meta?:{
        current_page: number;
        next_page: number | null;
        prev_page: number | null;
        total_count: number;
        total_page: number;
    }
};

export const sendResponse = <T>(res: Response, data: TResponse<any>)=> {
    res.status(data.statusCode).json({
        message: data.message,
        data: data.data,
        pagination: data.meta,
        status: "success",
        success: true,
        meta: data.meta
    });
};