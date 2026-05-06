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

      if (segments.length < 2) {
        await sleep(1000);
        continue;
      }

      const latestSegments = segments.slice(-2);
      const baseUrl = stream.hls_playback_url.replace(/[^/]+\.m3u8$/, "");

      const segmentChecks = await Promise.all(
        latestSegments.map(async (segment) => {
          try {
            const segmentResponse = await fetch(`${baseUrl}${segment}`, {
              method: "HEAD",
              signal: AbortSignal.timeout(3000),
            });

            return segmentResponse.ok;
          } catch {
            return false;
          }
        }),
      );

      if (!segmentChecks.every(Boolean)) {
        await sleep(1000);
        continue;
      }

      await updatePlaybackStatus({
        streamId,
        playbackStatus: "ready",
      });

      return;
    } catch {
      await sleep(1000);
    }
  }

  await updatePlaybackStatus({
    streamId,
    playbackStatus: "failed",
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
