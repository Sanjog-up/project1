import express from "express"
import { authenticate } from "../middlewares/auth.middleware"
import { Role } from "../types/enum.types"
import { createRating, getRatingsForUser } from "../controllers/rating.controller"

const router = express.Router();

router.post("/", authenticate([Role.USER, Role.WORKER]), createRating);
router.get("/user/:userId", authenticate(), getRatingsForUser);

export default router;