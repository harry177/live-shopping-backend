import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
} from "livekit-server-sdk";

import { env } from "../config/env";
import { findStreamById } from "../repositories/stream.repository";
import {
  completeRecording,
  createRecording,
  findActiveRecordingByStreamId,
  listCompletedRecordings,
} from "../repositories/recording.repository";

const egressClient = new EgressClient(
  env.LIVEKIT_HTTP_URL,
  env.LIVEKIT_API_KEY,
  env.LIVEKIT_API_SECRET,
);

export async function startStreamRecording(streamId: string, userId: string) {
  const stream = await findStreamById(streamId);

  if (!stream || stream.status !== "live") {
    throw new Error("Live stream not found");
  }

  if (stream.streamer_user_id !== userId) {
    throw new Error("Forbidden");
  }

  const existingRecording = await findActiveRecordingByStreamId(stream.id);

  if (existingRecording) {
    return existingRecording;
  }

  const fileName = `${stream.id}.mp4`;
  const filePath = `/recordings/${fileName}`;
  const playbackUrl = `${env.PUBLIC_API_URL}/recordings/${fileName}`;

  const output = new EncodedFileOutput({
    filepath: filePath,
    fileType: EncodedFileType.MP4,
  });

  const egress = await egressClient.startRoomCompositeEgress(
    stream.room_name,
    {
      file: output,
    },
    {
      layout: "speaker",
    },
  );

  return createRecording({
    streamId: stream.id,
    egressId: egress.egressId,
    filePath,
    playbackUrl,
  });
}

export async function stopStreamRecording(streamId: string) {
  const recording = await findActiveRecordingByStreamId(streamId);

  if (!recording) {
    return;
  }

  try {
    await egressClient.stopEgress(recording.egress_id);
  } catch {
    // egress may already be stopped
  }

  await completeRecording(recording.id);
}

export async function getCompletedRecordings() {
  return listCompletedRecordings();
}
