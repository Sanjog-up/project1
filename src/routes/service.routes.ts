import express from "express";
import { listServices, createService, updateService, getServiceById } from "../controllers/service.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { Only_Admins } from "../types/enum.types";

const router = express.Router();

//! list all services(public)
router.get("/", listServices);

//! create a new service (admin only)
router.post("/", authenticate(Only_Admins), createService);

//! update a service (admin only)
router.put("/:id", authenticate(Only_Admins), updateService); 

//! get service by id
router.get("/:id", getServiceById);

export default router;


