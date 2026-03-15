const { migrate, getDb } = require("./sqlite");

function init() {
  migrate();
}

function addWarn(guildId, userId, { modId, reason }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO sanctions (guild_id, user_id, type, reason, mod_id, created_at)
     VALUES (?, ?, 'warn', ?, ?, ?)`
  ).run(String(guildId), String(userId), reason || null, String(modId), Date.now());
}

function addNote(guildId, userId, { modId, note }) {
  const db = getDb();
  db.prepare(
    `INSERT INTO sanctions (guild_id, user_id, type, reason, mod_id, created_at)
     VALUES (?, ?, 'note', ?, ?, ?)`
  ).run(String(guildId), String(userId), note || null, String(modId), Date.now());
}

function addStrike(guildId, userId, amount, { modId, reason } = {}) {
  const db = getDb();
  db.prepare(
    `INSERT INTO sanctions (guild_id, user_id, type, amount, reason, mod_id, created_at)
     VALUES (?, ?, 'strike', ?, ?, ?, ?)`
  ).run(String(guildId), String(userId), Number(amount) || 1, reason || null, modId ? String(modId) : null, Date.now());
}

function summary(guildId, userId) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT type, amount, reason, mod_id, created_at
     FROM sanctions
     WHERE guild_id = ? AND user_id = ?
     ORDER BY created_at DESC`
  ).all(String(guildId), String(userId));

  let strikes = 0;
  const warns = [];
  const notes = [];

  for (const r of rows) {
    if (r.type === "strike") strikes += Number(r.amount) || 0;
    if (r.type === "warn") warns.push(r);
    if (r.type === "note") notes.push(r);
  }

  return { strikes, warns, notes, rows };
}

function clearUser(guildId, userId) {
  const db = getDb();
  const info = db.prepare(`DELETE FROM sanctions WHERE guild_id = ? AND user_id = ?`).run(String(guildId), String(userId));
  return info.changes || 0;
}

function clearAllGuild(guildId) {
  const db = getDb();
  const info = db.prepare(`DELETE FROM sanctions WHERE guild_id = ?`).run(String(guildId));
  return info.changes || 0;
}

module.exports = {
  init,
  addWarn,
  addNote,
  addStrike,
  summary,
  clearUser,
  clearAllGuild
};
