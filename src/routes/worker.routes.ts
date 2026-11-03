import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { Only_Admins, Role } from "../types/enum.types";
import { setAvailability, verifyWorker } from "../controllers/worker.controller";

const router = express.Router();
router.patch("/avalability", authenticate([Role.WORKER]), setAvailability);

router.patch("/:id/verify", authenticate(Only_Admins), verifyWorker);

export default router;