import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const dbPath = process.env.DB_PATH ?? './data/app.db';
mkdirSync(dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS pings (
    id INTEGER PRIMARY KEY,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

const insertPing = db.prepare('INSERT INTO pings DEFAULT VALUES');
const countPings = db.prepare('SELECT count(*) AS n FROM pings');

export function recordPing(): number {
  insertPing.run();
  return (countPings.get() as { n: number }).n;
}
