import { Router } from "express";
import {
  createViewerTokenController,
  getActiveStreamController,
  getRecordingsController,
  startStreamController,
  startStreamOutputsController,
  stopStreamController,
} from "../controllers/stream.controller";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();

router.get("/active", getActiveStreamController);
router.post("/start", requireAuth, startStreamController);

router.get("/recordings", getRecordingsController);

router.post("/:id/outputs/start", requireAuth, startStreamOutputsController);
router.post("/:id/stop", requireAuth, stopStreamController);
router.post("/:id/view-token", createViewerTokenController);


export default router;
