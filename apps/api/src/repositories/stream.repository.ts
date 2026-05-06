import { db } from "../db";

export type StreamStatus = "live" | "ended";

export type PlaybackStatus = "preparing" | "ready" | "failed";

export interface StreamRow {
  id: string;
  streamer_user_id: string;
  streamer_display_name: string;
  room_name: string;
  status: StreamStatus;
  playback_status: PlaybackStatus;
  started_at: Date | null;
  ended_at: Date | null;
  deadline_at: Date;
  created_at: Date;
  hls_egress_id: string | null;
  hls_playback_url: string | null;
}

export async function findActiveStream(): Promise<StreamRow | null> {
  const result = await db.query<StreamRow>(
    `
      select *
      from streams
      where status = 'live'
      order by created_at desc
      limit 1
    `,
  );

  return result.rows[0] ?? null;
}

export async function createStream(params: {
  streamerUserId: string;
  streamerDisplayName: string;
  roomName: string;
  deadlineAt: Date;
}): Promise<StreamRow> {
  const result = await db.query<StreamRow>(
    `
      insert into streams (
        streamer_user_id,
        streamer_display_name,
        room_name,
        status,
        started_at,
        deadline_at
      )
      values ($1, $2, $3, 'live', now(), $4)
      returning *
    `,
    [
      params.streamerUserId,
      params.streamerDisplayName,
      params.roomName,
      params.deadlineAt,
    ],
  );

  return result.rows[0];
}

export async function findStreamById(id: string): Promise<StreamRow | null> {
  const result = await db.query<StreamRow>(
    `
      select *
      from streams
      where id = $1
      limit 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function endStream(id: string): Promise<void> {
  await db.query(
    `
      update streams
      set status = 'ended',
          ended_at = now()
      where id = $1
        and status = 'live'
    `,
    [id],
  );
}

export async function findExpiredLiveStreams(): Promise<StreamRow[]> {
  const result = await db.query<StreamRow>(
    `
      select *
      from streams
      where status = 'live'
        and deadline_at <= now()
    `,
  );

  return result.rows;
}

export async function updateStreamHls(params: {
  streamId: string;
  hlsEgressId: string;
  hlsPlaybackUrl: string;
}): Promise<void> {
  await db.query(
    `
      update streams
      set hls_egress_id = $2,
          hls_playback_url = $3
      where id = $1
    `,
    [params.streamId, params.hlsEgressId, params.hlsPlaybackUrl],
  );
}

export async function updatePlaybackStatus(params: {
  streamId: string;
  playbackStatus: PlaybackStatus;
}): Promise<void> {
  await db.query(
    `
      update streams
      set playback_status = $2
      where id = $1
    `,
    [params.streamId, params.playbackStatus],
  );
}
