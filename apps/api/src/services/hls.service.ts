import {
  EgressClient,
  StreamOutput,
  StreamProtocol,
} from "livekit-server-sdk";

import { env } from "../config/env";
import {
  StreamRow,
  updateStreamHls,
} from "../repositories/stream.repository";

const egressClient = new EgressClient(
  env.LIVEKIT_HTTP_URL,
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

export async function startStreamHlsEgress(stream: StreamRow) {
  const streamKey = stream.id;

  const rtmpUrl = `${env.SRS_RTMP_BASE_URL}/${streamKey}`;
  const hlsPlaybackUrl = `${env.HLS_PUBLIC_BASE_URL}/${streamKey}.m3u8`;

  const output = new StreamOutput({
    protocol: StreamProtocol.RTMP,
    urls: [rtmpUrl],
  });

  const egress = await egressClient.startRoomCompositeEgress(
    stream.room_name,
    {
      stream: output,
    },
    {
      layout: "speaker",
    },
  );

  await updateStreamHls({
    streamId: stream.id,
    hlsEgressId: egress.egressId,
    hlsPlaybackUrl,
  });

  return {
    egressId: egress.egressId,
    playbackUrl: hlsPlaybackUrl,
  };
}

export async function stopStreamHlsEgress(stream: StreamRow) {
  if (!stream.hls_egress_id) return;

  try {
    await egressClient.stopEgress(stream.hls_egress_id);
  } catch {}
}