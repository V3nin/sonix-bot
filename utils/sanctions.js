const { readJson, writeJson } = require("./storage");

function getAll() {
  return readJson("sanctions", {});
}

function saveAll(all) {
  writeJson("sanctions", all);
}

function ensureGuild(all, guildId) {
  if (!all[guildId]) all[guildId] = {};
  return all[guildId];
}

function ensureUser(guildObj, userId) {
  if (!guildObj[userId]) {
    guildObj[userId] = {
      warns: [],
      notes: [],
      strikes: 0
    };
  }
  return guildObj[userId];
}

function addWarn(guildId, userId, entry) {
  const all = getAll();
  const guildObj = ensureGuild(all, guildId);
  const userObj = ensureUser(guildObj, userId);
  userObj.warns.push(entry);
  saveAll(all);
  return userObj;
}

function addNote(guildId, userId, entry) {
  const all = getAll();
  const guildObj = ensureGuild(all, guildId);
  const userObj = ensureUser(guildObj, userId);
  userObj.notes.push(entry);
  saveAll(all);
  return userObj;
}

function addStrike(guildId, userId, amount = 1) {
  const all = getAll();
  const guildObj = ensureGuild(all, guildId);
  const userObj = ensureUser(guildObj, userId);
  userObj.strikes = (userObj.strikes || 0) + amount;
  saveAll(all);
  return userObj.strikes;
}

function getUser(guildId, userId) {
  const all = getAll();
  const guildObj = all[guildId];
  if (!guildObj) return null;
  return guildObj[userId] || null;
}

function clearSanctions(guildId, userId) {
  const all = getAll();
  const guildObj = all[guildId];
  if (!guildObj) return false;
  if (!guildObj[userId]) return false;
  delete guildObj[userId];
  saveAll(all);
  return true;
}

function clearAllSanctions(guildId) {
  const all = getAll();
  if (!all[guildId]) return false;
  delete all[guildId];
  saveAll(all);
  return true;
}

module.exports = {
  addWarn,
  addNote,
  addStrike,
  getUser,
  clearSanctions,
  clearAllSanctions
};
