import { Router } from "express";
import { createLiveKitToken } from "../controllers/livekit.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "api",
  });
});

router.get("/api/v1/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    version: "v1",
  });
});

router.post("/api/v1/livekit/token", createLiveKitToken);

export default router;
