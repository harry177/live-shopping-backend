import {
  findStreamById,
  updatePlaybackStatus,
} from "../repositories/stream.repository";

export async function waitForHlsReady(streamId: string) {
  console.log("[HLS READY] start", streamId);

  const stream = await findStreamById(streamId);

  if (!stream?.hls_playback_url) {
    console.log("[HLS READY] no playback url", streamId);
    return;
  }

  console.log("[HLS READY] url", stream.hls_playback_url);

  const maxAttempts = 30;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const manifestResponse = await fetch(stream.hls_playback_url, {
        signal: AbortSignal.timeout(3000),
      });

      if (!manifestResponse.ok) {
        await sleep(1000);
        continue;
      }

      const manifest = await manifestResponse.text();

      const segments = manifest
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.endsWith(".ts"));

      if (segments.length < 3) {
        await sleep(1000);
        continue;
      }

      const baseUrl = stream.hls_playback_url.replace(/[^/]+\.m3u8$/, "");

      const segmentChecks = await Promise.all(
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

      if (!segmentChecks.every(Boolean)) {
        await sleep(1000);
        continue;
      }

      console.log("[HLS READY] ready", streamId, segments.length);

      await updatePlaybackStatus({
        streamId,
        playbackStatus: "ready",
      });

      return;
    } catch {
      await sleep(1000);
    }
  }

  console.log("[HLS READY] not ready after attempts", streamId);

  return;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
