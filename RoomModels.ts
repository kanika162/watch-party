import { db } from "../db";

export interface RoomRecord {
  id: string;
  host_id: string | null;
  current_video_id: string | null;
  current_time: number;
  is_playing: number;
  created_at: string;
}

export const RoomModel = {
  create(id: string, hostId: string | null): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO rooms (id, host_id, current_video_id, current_time, is_playing, created_at)
        VALUES (?, ?, NULL, 0, 0, datetime('now'))
      `,
        [id, hostId],
        err => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  findById(id: string): Promise<RoomRecord | undefined> {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM rooms WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as RoomRecord | undefined);
      });
    });
  },

  updateState(
    id: string,
    {
      currentVideoId,
      currentTime,
      isPlaying,
      hostId
    }: { currentVideoId?: string | null; currentTime?: number; isPlaying?: boolean; hostId?: string | null }
  ): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (currentVideoId !== undefined) {
      fields.push("current_video_id = ?");
      values.push(currentVideoId);
    }
    if (currentTime !== undefined) {
      fields.push("current_time = ?");
      values.push(currentTime);
    }
    if (isPlaying !== undefined) {
      fields.push("is_playing = ?");
      values.push(isPlaying ? 1 : 0);
    }
    if (hostId !== undefined) {
      fields.push("host_id = ?");
      values.push(hostId);
    }
    if (!fields.length) return Promise.resolve();

    values.push(id);
    const sql = `UPDATE rooms SET ${fields.join(", ")} WHERE id = ?`;

    return new Promise((resolve, reject) => {
      db.run(sql, values, err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};
