import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthUser } from "../types/auth";

interface JwtPayload {
  sub: string;
  email: string;
  displayName: string;
  canStream: boolean;
}

export function signAccessToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      canStream: user.canStream,
    },
    env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

export function verifyAccessToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

  return {
    id: decoded.sub,
    email: decoded.email,
    displayName: decoded.displayName,
    canStream: decoded.canStream,
  };
}
