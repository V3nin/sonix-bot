const { PermissionsBitField } = require("discord.js");

function tokenize(message) {
  return message.content.trim().split(/\s+/);
}

function parseUsers(message) {
  const users = [];

  // mentions
  for (const [, user] of message.mentions.users) users.push(user);

  // ids in args
  const parts = tokenize(message).slice(1);
  for (const token of parts) {
    const id = token.replace(/[<@!>]/g, "");
    if (/^\d{16,20}$/.test(id)) {
      const user = message.client.users.cache.get(id);
      if (user && !users.find(u => u.id === user.id)) users.push(user);
    }
  }

  return users;
}

function parseReason(message, userCount = 1, skipTokens = 0) {
  const tokens = tokenize(message);

  // remove command
  tokens.shift();

  // remove extra tokens after command (e.g. duration)
  for (let i = 0; i < skipTokens; i++) tokens.shift();

  // remove user tokens (mentions or ids)
  let removed = 0;
  const remaining = [];
  for (const t of tokens) {
    if (removed < userCount && (t.startsWith("<@") || /^\d{16,20}$/.test(t))) {
      removed++;
      continue;
    }
    remaining.push(t);
  }

  const reason = remaining.join(" ").trim();
  return reason || "No reason provided";
}

function requirePerms(member, perms = []) {
  return perms.every(p => member.permissions.has(p));
}

function canModerate(me, targetMember) {
  if (!targetMember) return false;
  if (!me) return false;
  if (targetMember.id === me.id) return false;
  if (targetMember.id === targetMember.guild.ownerId) return false;

  // role hierarchy
  return me.roles.highest.comparePositionTo(targetMember.roles.highest) > 0;
}

function msFromHuman(input) {
  // supports: 10m, 2h, 7d, 30s
  if (!input) return null;
  const m = String(input).trim().match(/^(\d+)(s|m|h|d)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return n * mult;
}

module.exports = {
  tokenize,
  parseUsers,
  parseReason,
  requirePerms,
  canModerate,
  msFromHuman,
  PermissionsBitField
};
