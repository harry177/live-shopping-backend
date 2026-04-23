import { Router } from "express";
import { loginController, meController } from "../controllers/auth.controller";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();

router.post("/login", loginController);
router.get("/me", requireAuth, meController);

export default router;
