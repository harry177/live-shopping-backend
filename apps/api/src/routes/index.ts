import { Router } from "express";

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

export default router;
