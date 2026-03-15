const path = require("path");

let Database;
try {
  // eslint-disable-next-line global-require
  Database = require("better-sqlite3");
} catch {
  Database = null;
}

const dbPath = path.join(__dirname, "..", "data", "sonix.sqlite");

let db = null;

function getDb() {
  if (db) return db;
  if (!Database) {
    throw new Error("Missing dependency: better-sqlite3");
  }
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

function migrate() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS sanctions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,           -- warn | note | strike
      amount INTEGER DEFAULT 0,     -- strike amount
      reason TEXT,
      mod_id TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sanctions_guild_user_created
      ON sanctions (guild_id, user_id, created_at);

    CREATE INDEX IF NOT EXISTS idx_sanctions_guild_type_created
      ON sanctions (guild_id, type, created_at);
  `);
}

module.exports = { getDb, migrate };
