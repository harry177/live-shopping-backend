import { Router } from "express";
import {
  createViewerTokenController,
  getActiveStreamController,
  startStreamController,
  stopStreamController,
} from "../controllers/stream.controller";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();

router.get("/active", getActiveStreamController);
router.post("/start", requireAuth, startStreamController);
router.post("/:id/stop", requireAuth, stopStreamController);
router.post("/:id/view-token", createViewerTokenController);

export default router;
