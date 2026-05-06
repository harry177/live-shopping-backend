import {
  findStreamById,
  updatePlaybackStatus,
} from "../repositories/stream.repository";

const MAX_ATTEMPTS = 30;
const MIN_READY_SEGMENTS = 5;
const STABLE_DELAY_MS = 5000;

export async function waitForHlsReady(streamId: string) {
  console.log("[HLS READY] start", streamId);

  const stream = await findStreamById(streamId);

  if (!stream?.hls_playback_url) {
    console.log("[HLS READY] no playback url", streamId);
    return;
  }

  console.log("[HLS READY] url", stream.hls_playback_url);

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const firstSegments = await getReadySegments(stream.hls_playback_url);

      if (firstSegments.length < MIN_READY_SEGMENTS) {
        await sleep(1000);
        continue;
      }

      await sleep(STABLE_DELAY_MS);

      const secondSegments = await getReadySegments(stream.hls_playback_url);

      if (secondSegments.length < MIN_READY_SEGMENTS) {
        await sleep(1000);
        continue;
      }

      const firstLastSegment = firstSegments[firstSegments.length - 1];
      const secondLastSegment = secondSegments[secondSegments.length - 1];

      if (!firstLastSegment || !secondLastSegment) {
        await sleep(1000);
        continue;
      }

      if (firstLastSegment === secondLastSegment) {
        await sleep(1000);
        continue;
      }

      console.log(
        "[HLS READY] ready",
        streamId,
        secondSegments.length,
        secondLastSegment,
      );

      await updatePlaybackStatus({
        streamId,
        playbackStatus: "ready",
      });

      return;
    } catch (error) {
      console.log("[HLS READY] attempt failed", streamId, error);
      await sleep(1000);
    }
  }

  console.log("[HLS READY] not ready after attempts", streamId);
}

async function getReadySegments(hlsPlaybackUrl: string) {
  const manifestResponse = await fetch(hlsPlaybackUrl, {
    signal: AbortSignal.timeout(3000),
  });

  if (!manifestResponse.ok) {
    return [];
  }

  const manifest = await manifestResponse.text();

  const segments = manifest
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.endsWith(".ts"));

  if (!segments.length) {
    return [];
  }

  const baseUrl = hlsPlaybackUrl.replace(/[^/]+\.m3u8$/, "");

  const checks = await Promise.all(
    segments.map(async (segment) => {
      try {
        const response = await fetch(`${baseUrl}${segment}`, {
          method: "HEAD",
          signal: AbortSignal.timeout(3000),
        });

        return response.ok;
      } catch {
        return false;
      }
    }),
  );

  if (!checks.every(Boolean)) {
    return [];
  }

  return segments;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
