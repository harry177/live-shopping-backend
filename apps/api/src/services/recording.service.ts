import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  StreamOutput,
  StreamProtocol,
} from "livekit-server-sdk";

import { env } from "../config/env";
import {
  findStreamById,
  updateStreamHls,
} from "../repositories/stream.repository";
import {
  completeRecording,
  createRecording,
  findActiveRecordingByStreamId,
  listCompletedRecordings,
} from "../repositories/recording.repository";
import { waitForHlsReady } from "./hls-readiness.service";

const egressClient = new EgressClient(
  env.LIVEKIT_HTTP_URL,
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

export async function startStreamOutputs(
  streamId: string,
  userId: string,
  shouldRecord: boolean,
) {
  const stream = await findStreamById(streamId);

  if (!stream || stream.status !== "live") {
    throw new Error("Live stream not found");
  }

  if (stream.streamer_user_id !== userId) {
    throw new Error("Forbidden");
  }

  if (stream.hls_egress_id && stream.hls_playback_url) {
    return {
      hls: {
        playbackUrl: stream.hls_playback_url,
      },
    };
  }

  const streamKey = stream.id;

  // RTMP (HLS через SRS)
  const rtmpUrl = `${env.SRS_RTMP_BASE_URL}/${streamKey}`;
  const hlsPlaybackUrl = `${env.HLS_PUBLIC_BASE_URL}/${streamKey}.m3u8`;

  const rtmpOutput = new StreamOutput({
    protocol: StreamProtocol.RTMP,
    urls: [rtmpUrl],
  });

  // MP4 (если включена запись)
  const fileName = `${stream.id}.mp4`;
  const filePath = `/recordings/${fileName}`;
  const recordingPlaybackUrl = `${env.PUBLIC_API_URL}/recordings/${fileName}`;

  const fileOutput = new EncodedFileOutput({
    filepath: filePath,
    fileType: EncodedFileType.MP4,
  });

  // combined output
  const output = shouldRecord
    ? {
        stream: rtmpOutput,
        file: fileOutput,
      }
    : {
        stream: rtmpOutput,
      };

  const egress = await egressClient.startRoomCompositeEgress(
    stream.room_name,
    output,
    {
      layout: "speaker",
    },
  );

  await updateStreamHls({
    streamId: stream.id,
    hlsEgressId: egress.egressId,
    hlsPlaybackUrl,
  });

  void waitForHlsReady(stream.id);

  if (shouldRecord) {
    await createRecording({
      streamId: stream.id,
      egressId: egress.egressId,
      filePath,
      playbackUrl: recordingPlaybackUrl,
    });
  }

  return {
    hls: {
      playbackUrl: hlsPlaybackUrl,
    },
  };
}

export async function stopStreamOutputs(streamId: string) {
  const stream = await findStreamById(streamId);

  if (!stream) return;

  if (!stream.hls_egress_id) return;

  try {
    await egressClient.stopEgress(stream.hls_egress_id);
  } catch {
    // ignore
  }

  const recording = await findActiveRecordingByStreamId(streamId);

  if (recording) {
    await completeRecording(recording.id);
  }
}

export async function getCompletedRecordings() {
  return listCompletedRecordings();
}
