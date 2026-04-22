import { Request, Response } from "express";
import { AccessToken } from "livekit-server-sdk";
import { z } from "zod";

import { env } from "../config/env";

const createTokenSchema = z.object({
  roomName: z.string().min(1),
  participantName: z.string().min(1),
});

export async function createLiveKitToken(req: Request, res: Response) {
  const parsed = createTokenSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: parsed.error.flatten(),
    });
  }

  const { roomName, participantName } = parsed.data;

  const at = new AccessToken(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET, {
    identity: participantName,
    ttl: "10m",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  });

  const token = await at.toJwt();

  return res.status(200).json({
    token,
    wsUrl: env.LIVEKIT_WS_URL,
  });
}
