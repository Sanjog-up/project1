import { Request, Response } from "express";
import mongoose from "mongoose";
import { Service } from "../models/services.model";
import { catchAsync } from "../utils/catchAsync.utils";
import { sendResponse } from "../utils/sendResponse.utils";
import AppError from "../utils/appError.utils";

const toSlug = (name:string) => name.trim().toLowerCase().replace(/\s+/g, "-");

const isValidPrice = (price: number) : price is number => 
    typeof price === "number" && price >= 1 && Number.isFinite(price);

//! list all services 
export const listServices = catchAsync(async (req: Request, res: Response) => {
    const services = await Service.find({ isActive: true }).sort({ name: 1 }).lean();
    sendResponse(res, { message: "Services fetched successfully", data: services, statusCode: 200 });
});

//! create a new service
export const createService = catchAsync(async (req: Request, res: Response) => {
    const { name, description, price } = req.body;

    if (typeof name !== "string" || name.trim().length < 3) {
        throw new AppError("Service name is required with at least 3 characters", 400);
    } 
    if(!isValidPrice(price)) {
        throw new AppError("Price must be a number greater than or equal to 1(NPR)", 400);
    }
    if (description !== undefined && typeof description !== "string") {
        throw new AppError("Description must be a string", 400);
    }

    const slug = toSlug(name);
    if(await Service.findOne({ slug })) {
        throw new AppError("Service with this name already exists", 400);
    }

    const service = await Service.create({ name: name.trim(), slug, description, price });
    sendResponse(res, { message: "Service created successfully", data: service, statusCode: 201 });
});

//! update service 
export const updateService = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string" || !mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError("Invalid service ID", 400);
    }

    const { name, description, price, isActive } = req.body;
    const updateData: Record<string, unknown> = {};
    if(name !== undefined) {
        if (typeof name !== "string" || name.trim().length < 3) {
            throw new AppError("Service name must be at least 3 characters long", 400);
        }
        updateData.name = name.trim();
    }
    if(description !== undefined) {
        if (typeof description !== "string") {
            throw new AppError("Description must be a string", 400);
        }
        updateData.description = description;
    }
    if(price !== undefined) {
        if(!isValidPrice(price)) {
            throw new AppError("Price must be a number greater than or equal to 1(NPR)", 400);
        }
        updateData.price = price;
    }
    if(isActive !== undefined) {
        if (typeof isActive !== "boolean") {
            throw new AppError("isActive must be a boolean", 400);
        }
        updateData.isActive = isActive;
    }
    if(Object.keys(updateData).length === 0) {
        throw new AppError("No valid fields provided for update", 400);
    }
    
    const service = await Service.findByIdAndUpdate(
        id,
        { $set: updateData },
        { returnDocument: "after", runValidators: true }
    );
    if(!service) {
        throw new AppError("Service not found", 404);
    }

    sendResponse(res, { message: "Service updated successfully", data: service, statusCode: 200 });
});

//! get service by id
export const getServiceById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    if (typeof id !== "string" ) {
        throw new AppError("Invalid service ID", 400);
    } 
    const service = mongoose.isValidObjectId(id) 
    ? await Service.findById({ _id: id, isActive: true }) 
    : await Service.findOne({ slug: id.toLowerCase(), isActive: true });

    if(!service) {
        throw new AppError("Service not found", 404);
    }

    sendResponse(res, { 
        message: "Service fetched successfully", 
        data: service, 
        statusCode: 200 });
});