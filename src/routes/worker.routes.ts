import express from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { Only_Admins, Role } from "../types/enum.types";
import { getWorkerDocuments, listPendingWorkers, setAvailability, verifyWorker } from "../controllers/worker.controller";

const router = express.Router();
router.patch("/availability", authenticate([Role.WORKER]), setAvailability);

router.get("/pending", authenticate(Only_Admins), listPendingWorkers);

router.get("/:id/documents", authenticate(Only_Admins), getWorkerDocuments);

router.patch("/:id/verify", authenticate(Only_Admins), verifyWorker);

export default router;