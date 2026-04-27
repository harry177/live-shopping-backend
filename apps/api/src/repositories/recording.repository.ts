import { db } from "../db";

export type RecordingStatus = "recording" | "completed" | "failed";

export interface RecordingRow {
  id: string;
  stream_id: string;
  egress_id: string;
  status: RecordingStatus;
  file_path: string;
  playback_url: string;
  started_at: Date;
  ended_at: Date | null;
  created_at: Date;
}

export async function createRecording(params: {
  streamId: string;
  egressId: string;
  filePath: string;
  playbackUrl: string;
}) {
  const result = await db.query<RecordingRow>(
    `
      insert into stream_recordings (
        stream_id,
        egress_id,
        status,
        file_path,
        playback_url
      )
      values ($1, $2, 'recording', $3, $4)
      returning *
    `,
    [params.streamId, params.egressId, params.filePath, params.playbackUrl],
  );

  return result.rows[0];
}

export async function findActiveRecordingByStreamId(streamId: string) {
  const result = await db.query<RecordingRow>(
    `
      select *
      from stream_recordings
      where stream_id = $1
        and status = 'recording'
      order by created_at desc
      limit 1
    `,
    [streamId],
  );

  return result.rows[0] ?? null;
}

export async function completeRecording(id: string) {
  await db.query(
    `
      update stream_recordings
      set status = 'completed',
          ended_at = now()
      where id = $1
    `,
    [id],
  );
}

export async function listCompletedRecordings() {
  const result = await db.query<RecordingRow>(
    `
      select *
      from stream_recordings
      where status = 'completed'
      order by created_at desc
    `,
  );

  return result.rows;
}
