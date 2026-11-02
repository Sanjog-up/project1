import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { Role } from "../types/enum.types";
import { setAvailability } from "../controllers/worker.controller";

const router = express.Router();
router.patch("/avalability", authenticate([Role.WORKER]), setAvailability);

export default router;