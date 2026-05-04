import { Router } from "express";
import {
  createViewerTokenController,
  getActiveStreamController,
  getRecordingsController,
  startRecordingController,
  startStreamController,
  startStreamHlsController,
  stopStreamController,
} from "../controllers/stream.controller";
import { requireAuth } from "../middlewares/require-auth";

const router = Router();

router.get("/active", getActiveStreamController);
router.post("/start", requireAuth, startStreamController);
router.post("/:id/hls/start", requireAuth, startStreamHlsController);
router.get("/recordings", getRecordingsController);
router.post("/:id/recordings/start", requireAuth, startRecordingController);
router.post("/:id/stop", requireAuth, stopStreamController);
router.post("/:id/view-token", createViewerTokenController);


export default router;
