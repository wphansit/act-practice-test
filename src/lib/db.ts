import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// The database lives outside the project directory by default
// (~/.act-app/act.db): a file-syncing client (OneDrive/Dropbox/etc.) copying a
// WAL-mode SQLite file mid-write risks corruption, and it keeps generated data
// out of the repo. Override with ACT_DB_PATH.
function resolveDbPath(): string {
  const fromEnv = process.env.ACT_DB_PATH;
  if (fromEnv && fromEnv.trim() !== "") return fromEnv;
  return path.join(os.homedir(), ".act-app", "act.db");
}

// Migrations directory is resolved from the project root; both `next dev/start`
// and `tsx scripts/*.ts` run with cwd = act-app.
const MIGRATIONS_DIR = path.join(process.cwd(), "db", "migrations");

function applyMigrations(db: Database.Database): void {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  const applied = db.pragma("user_version", { simple: true }) as number;
  for (let i = applied; i < files.length; i++) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, files[i]), "utf-8");
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${i + 1}`);
    })();
  }
}

function openDb(): Database.Database {
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  applyMigrations(db);
  return db;
}

// Cached on globalThis so Next.js dev hot-reload reuses one connection.
const globalCache = globalThis as unknown as { __actDb?: Database.Database };

export function getDb(): Database.Database {
  if (!globalCache.__actDb) {
    globalCache.__actDb = openDb();
  }
  return globalCache.__actDb;
}

export function nowIso(): string {
  return new Date().toISOString();
}
