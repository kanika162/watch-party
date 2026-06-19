import { db } from "../db";

export type Role = "host" | "moderator" | "participant";

export interface ParticipantRecord {
  id: string;
  room_id: string;
  username: string;
  role: Role;
  is_online: number;
  joined_at: string;
}

export const ParticipantModel = {
  add(participant: {
    id: string;
    roomId: string;
    username: string;
    role: Role;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO participants (id, room_id, username, role, is_online, joined_at)
        VALUES (?, ?, ?, ?, 1, datetime('now'))
      `,
        [participant.id, participant.roomId, participant.username, participant.role],
        err => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  findByRoom(roomId: string): Promise<ParticipantRecord[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM participants WHERE room_id = ? ORDER BY joined_at ASC`,
        [roomId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as ParticipantRecord[]);
        }
      );
    });
  },

  findById(id: string): Promise<ParticipantRecord | undefined> {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM participants WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as ParticipantRecord | undefined);
      });
    });
  },

  markOnline(id: string, isOnline: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE participants SET is_online = ? WHERE id = ?`,
        [isOnline ? 1 : 0, id],
        err => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  },

  updateRole(id: string, role: Role): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE participants SET role = ? WHERE id = ?`, [role, id], err => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  remove(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM participants WHERE id = ?`, [id], err => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  oldestOnlineParticipant(roomId: string): Promise<ParticipantRecord | undefined> {
    return new Promise((resolve, reject) => {
      db.get(
        `
        SELECT * FROM participants
        WHERE room_id = ? AND is_online = 1
        ORDER BY joined_at ASC
        LIMIT 1
      `,
        [roomId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as ParticipantRecord | undefined);
        }
      );
    });
  }
};
