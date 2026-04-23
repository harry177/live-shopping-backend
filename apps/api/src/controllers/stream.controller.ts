import { Request, Response } from "express";
import {
  getActiveStream,
  startStream,
  stopStream,
  createPublicViewerAccess,
} from "../services/stream.service";

export async function getActiveStreamController(_req: Request, res: Response) {
  const stream = await getActiveStream();

  return res.status(200).json({
    stream,
  });
}

export async function startStreamController(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const result = await startStream(req.user);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to start stream",
    });
  }
}

export async function stopStreamController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    await stopStream(req.params.id, req.user);

    return res.status(200).json({
      ok: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to stop stream";

    const status = message === "Forbidden" ? 403 : 400;

    return res.status(status).json({
      error: message,
    });
  }
}

export async function createViewerTokenController(
  req: Request<{ id: string }>,
  res: Response,
) {
  try {
    const result = await createPublicViewerAccess(req.params.id);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(404).json({
      error: error instanceof Error ? error.message : "Failed to join stream",
    });
  }
}
