import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const user = verifyAccessToken(token);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
