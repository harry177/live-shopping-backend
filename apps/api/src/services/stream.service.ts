import {
  createStream,
  endStream,
  findActiveStream,
  findExpiredLiveStreams,
  findStreamById,
} from "../repositories/stream.repository";

import { generateRoomName } from "../utils/random";

import { createPublisherToken, deleteRoom } from "./livekit.service";

import { stopStreamRecording } from "./recording.service";

import { startStreamHlsEgress, stopStreamHlsEgress } from "./hls.service";

import { env } from "../config/env";
import { AuthUser } from "../types/auth";

const STREAM_DURATION_MS = 60 * 1000;

export async function getActiveStream() {
  return findActiveStream();
}

export async function startStream(user: AuthUser) {
  if (!user.canStream) {
    throw new Error("User is not allowed to stream");
  }

  const existingLive = await findActiveStream();

  if (existingLive) {
    throw new Error("Another live stream is already active");
  }

  const roomName = generateRoomName(user.id);
  const deadlineAt = new Date(Date.now() + STREAM_DURATION_MS);

  const stream = await createStream({
    streamerUserId: user.id,
    streamerDisplayName: user.displayName,
    roomName,
    deadlineAt,
  });

  const token = await createPublisherToken({
    roomName,
    participantIdentity: user.id,
    participantName: user.displayName,
  });

  return {
    stream,
    livekit: {
      token,
      wsUrl: env.LIVEKIT_WS_URL,
    },
  };
}

export async function startStreamHls(streamId: string, user: AuthUser) {
  const stream = await findStreamById(streamId);

  if (!stream) {
    throw new Error("Stream not found");
  }

  if (stream.streamer_user_id !== user.id) {
    throw new Error("Forbidden");
  }

  if (stream.status !== "live") {
    throw new Error("Stream is not live");
  }

  if (stream.hls_egress_id && stream.hls_playback_url) {
    return {
      stream,
      hls: {
        playbackUrl: stream.hls_playback_url,
      },
    };
  }

  const hls = await startStreamHlsEgress(stream);

  return {
    stream: {
      ...stream,
      hls_egress_id: hls.egressId,
      hls_playback_url: hls.playbackUrl,
    },
    hls: {
      playbackUrl: hls.playbackUrl,
    },
  };
}

export async function stopStream(streamId: string, user: AuthUser) {
  const stream = await findStreamById(streamId);

  if (!stream) {
    throw new Error("Stream not found");
  }

  if (stream.streamer_user_id !== user.id) {
    throw new Error("Forbidden");
  }

  if (stream.status !== "live") {
    return;
  }

  // Stop HLS egress
  await stopStreamHlsEgress(stream);

  await stopStreamRecording(stream.id);

  try {
    await deleteRoom(stream.room_name);
  } catch {
    // ignore
  }

  await endStream(stream.id);
}

// Not returning LIVEKIT TOKEN anymore
export async function createPublicViewerAccess(streamId: string) {
  const stream = await findStreamById(streamId);

  if (!stream || stream.status !== "live") {
    throw new Error("Live stream not found");
  }

  if (!stream.hls_playback_url) {
    throw new Error("Stream is not ready yet");
  }

  return {
    stream,
    hls: {
      playbackUrl: stream.hls_playback_url,
    },
  };
}

export async function stopExpiredStreams() {
  const expiredStreams = await findExpiredLiveStreams();

  for (const stream of expiredStreams) {
    await stopStreamHlsEgress(stream);

    await stopStreamRecording(stream.id);

    try {
      await deleteRoom(stream.room_name);
    } catch {}

    await endStream(stream.id);
  }
}
