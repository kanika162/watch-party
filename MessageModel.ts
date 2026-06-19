import { db } from "../db";

export interface MessageRecord {
  id: number;
  room_id: string;
  participant_id: string;
  username: string;
  content: string;
  created_at: string;
}

export const MessageModel = {
  add(message: {
    roomId: string;
    participantId: string;
    username: string;
    content: string;
  }): Promise<MessageRecord> {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO messages (room_id, participant_id, username, content, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `,
        [message.roomId, message.participantId, message.username, message.content],
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) reject(err);
          else {
            const id = this.lastID;
            db.get(`SELECT * FROM messages WHERE id = ?`, [id], (err2, row) => {
              if (err2) reject(err2);
              else resolve(row as MessageRecord);
            });
          }
        }
      );
    });
  },

  findByRoom(roomId: string, limit = 50): Promise<MessageRecord[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `
        SELECT * FROM messages
        WHERE room_id = ?
        ORDER BY created_at ASC
        LIMIT ?
      `,
        [roomId, limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as MessageRecord[]);
        }
      );
    });
  }
};
