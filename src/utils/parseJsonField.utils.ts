import AppError from "./appError.utils";

export const parseJsonField = (value: unknown, fieldname: string) => {
    if(typeof value !== "string") return value;
    try {
        return JSON.parse(value);
    } catch{
        throw new AppError(`${fieldname} must be valid JSON`, 400);
    }
}