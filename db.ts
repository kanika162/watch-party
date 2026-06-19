import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const dbFile =
  process.env.SQLITE_FILE ||
  path.join(process.cwd(), process.env.NODE_ENV === "production" ? "data.sqlite3" : "dev.sqlite3");

if (!fs.existsSync(path.dirname(dbFile))) {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
}

export const db = new sqlite3.Database(dbFile);

export const initDb = () => {
  const schemaPath = path.join(__dirname, "../sql/schema.sql");
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema, err => {
      if (err) {
        console.error("Error applying schema:", err);
      }
    });
  }
};
