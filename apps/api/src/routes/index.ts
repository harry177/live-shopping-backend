import { Router } from "express";
import authRoutes from "./auth.routes";
import streamRoutes from "./stream.routes";

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

router.use("/api/v1/auth", authRoutes);
router.use("/api/v1/streams", streamRoutes);

export default router;
