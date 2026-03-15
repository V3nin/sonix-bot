const {
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");

const {
  tokenize,
  parseUsers,
  parseReason,
  requirePerms,
  canModerate,
  msFromHuman
} = require("../utils/modUtils");

const sanctions = require("../utils/sanctions");
const logManager = require("../utils/logManager");
const manageUtils = require("../utils/manageUtils");

const PREFIX = "=";

async function handleLock(message, all = false) {
  if (!manageUtils.canManageChannels(message.member)) {
    return manageUtils.reply(message, "❌ You need Manage Channels permission.");
  }

  const reason = message.content.split(/\s+/).slice(all ? 2 : 1).join(" ").trim() || "No reason provided";

  if (all) {
    const chans = message.guild.channels.cache.filter(c => [0, 5].includes(c.type));
    let ok = 0;
    for (const [, ch] of chans) {
      const did = await manageUtils.setChannelLocked(ch, true, reason);
      if (did) ok++;
    }

    const embed = logManager.makeModEmbed("Lock All", [
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Channels", value: String(ok), inline: true },
      { name: "Reason", value: reason }
    ], 0xed4245);
    await logManager.log(message.guild, "modlog", embed);

    return manageUtils.reply(message, `🔒 Locked ${ok} channels.`);
  }

  await manageUtils.setChannelLocked(message.channel, true, reason);

  const embed = logManager.makeModEmbed("Lock", [
    { name: "Channel", value: `${message.channel}` },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
    { name: "Reason", value: reason }
  ], 0xed4245);
  await logManager.log(message.guild, "modlog", embed);

  return manageUtils.reply(message, `🔒 Locked ${message.channel}.`);
}

async function handleUnlock(message, all = false) {
  if (!manageUtils.canManageChannels(message.member)) {
    return manageUtils.reply(message, "❌ You need Manage Channels permission.");
  }

  const reason = message.content.split(/\s+/).slice(all ? 2 : 1).join(" ").trim() || "No reason provided";

  if (all) {
    const chans = message.guild.channels.cache.filter(c => [0, 5].includes(c.type));
    let ok = 0;
    for (const [, ch] of chans) {
      const did = await manageUtils.setChannelLocked(ch, false, reason);
      if (did) ok++;
    }

    const embed = logManager.makeModEmbed("Unlock All", [
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Channels", value: String(ok), inline: true },
      { name: "Reason", value: reason }
    ], 0x57f287);
    await logManager.log(message.guild, "modlog", embed);

    return manageUtils.reply(message, `🔓 Unlocked ${ok} channels.`);
  }

  await manageUtils.setChannelLocked(message.channel, false, reason);

  const embed = logManager.makeModEmbed("Unlock", [
    { name: "Channel", value: `${message.channel}` },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
    { name: "Reason", value: reason }
  ], 0x57f287);
  await logManager.log(message.guild, "modlog", embed);

  return manageUtils.reply(message, `🔓 Unlocked ${message.channel}.`);
}

async function handleHide(message, all = false) {
  if (!manageUtils.canManageChannels(message.member)) {
    return manageUtils.reply(message, "❌ You need Manage Channels permission.");
  }

  const reason = message.content.split(/\s+/).slice(all ? 2 : 1).join(" ").trim() || "No reason provided";

  if (all) {
    const chans = message.guild.channels.cache;
    let ok = 0;
    for (const [, ch] of chans) {
      const did = await manageUtils.setChannelHidden(ch, true, reason);
      if (did) ok++;
    }

    const embed = logManager.makeModEmbed("Hide All", [
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Channels", value: String(ok), inline: true },
      { name: "Reason", value: reason }
    ], 0xed4245);
    await logManager.log(message.guild, "modlog", embed);

    return manageUtils.reply(message, `🙈 Hid ${ok} channels.`);
  }

  await manageUtils.setChannelHidden(message.channel, true, reason);

  const embed = logManager.makeModEmbed("Hide", [
    { name: "Channel", value: `${message.channel}` },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
    { name: "Reason", value: reason }
  ], 0xed4245);
  await logManager.log(message.guild, "modlog", embed);

  return manageUtils.reply(message, `🙈 Hid ${message.channel}.`);
}

async function handleUnhide(message, all = false) {
  if (!manageUtils.canManageChannels(message.member)) {
    return manageUtils.reply(message, "❌ You need Manage Channels permission.");
  }

  const reason = message.content.split(/\s+/).slice(all ? 2 : 1).join(" ").trim() || "No reason provided";

  if (all) {
    const chans = message.guild.channels.cache;
    let ok = 0;
    for (const [, ch] of chans) {
      const did = await manageUtils.setChannelHidden(ch, false, reason);
      if (did) ok++;
    }

    const embed = logManager.makeModEmbed("Unhide All", [
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Channels", value: String(ok), inline: true },
      { name: "Reason", value: reason }
    ], 0x57f287);
    await logManager.log(message.guild, "modlog", embed);

    return manageUtils.reply(message, `👁️ Unhid ${ok} channels.`);
  }

  await manageUtils.setChannelHidden(message.channel, false, reason);

  const embed = logManager.makeModEmbed("Unhide", [
    { name: "Channel", value: `${message.channel}` },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
    { name: "Reason", value: reason }
  ], 0x57f287);
  await logManager.log(message.guild, "modlog", embed);

  return manageUtils.reply(message, `👁️ Unhid ${message.channel}.`);
}

async function handleNick(message) {
  if (!manageUtils.canManageNick(message.member)) {
    return manageUtils.reply(message, "❌ You need Manage Nicknames permission.");
  }

  const users = parseUsers(message);
  if (!users.length) return manageUtils.reply(message, "Usage: =nick @user <new nickname>");

  const target = users[0];
  const member = await message.guild.members.fetch(target.id).catch(() => null);
  if (!member) return manageUtils.reply(message, "❌ Member not found.");

  const me = message.guild.members.me;
  if (!canModerate(me, member)) return manageUtils.reply(message, "❌ I can't change this member's nickname (role hierarchy).");

  const tokens = tokenize(message);
  // tokens: ['=nick', '@user', ...nick]
  const newNick = tokens.slice(2).join(" ").trim();
  if (!newNick) return manageUtils.reply(message, "Usage: =nick @user <new nickname>");

  await member.setNickname(newNick, `Nick change by ${message.author.tag}`).catch(() => {});

  const embed = logManager.makeModEmbed("Nick", [
    { name: "User", value: `${target.tag} (${target.id})` },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
    { name: "New Nick", value: newNick }
  ], 0x5865f2);
  await logManager.log(message.guild, "modlog", embed);

  return manageUtils.reply(message, `✅ Nick changed for ${target.tag}.`);
}

function reply(message, content) {
  return message.reply({ content }).catch(() => {});
}

async function handleWarn(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.ModerateMembers])) {
    return reply(message, "❌ You need Moderate Members permission.");
  }

  const users = parseUsers(message);
  if (!users.length) return reply(message, "Usage: =warn @user [@user2 ...] [reason]");

  const reason = parseReason(message, users.length);

  const results = [];
  for (const user of users) {
    sanctions.addWarn(message.guild.id, user.id, {
      modId: message.author.id,
      reason,
      at: Date.now()
    });

    results.push(user.tag);

    const embed = logManager.makeModEmbed("Warn", [
      { name: "User", value: `${user.tag} (${user.id})`, inline: false },
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})`, inline: false },
      { name: "Reason", value: reason, inline: false }
    ], 0xfee75c);

    await logManager.log(message.guild, "modlog", embed);
  }

  return reply(message, `✅ Warned: ${results.join(", ")}`);
}

async function handleNote(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.ModerateMembers])) {
    return reply(message, "❌ You need Moderate Members permission.");
  }

  const users = parseUsers(message);
  if (!users.length) return reply(message, "Usage: =note @user [@user2 ...] [note]");

  const note = parseReason(message, users.length);

  const results = [];
  for (const user of users) {
    sanctions.addNote(message.guild.id, user.id, {
      modId: message.author.id,
      note,
      at: Date.now()
    });

    results.push(user.tag);

    const embed = logManager.makeModEmbed("Note", [
      { name: "User", value: `${user.tag} (${user.id})` },
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Note", value: note }
    ], 0x99aab5);

    await logManager.log(message.guild, "modlog", embed);
  }

  return reply(message, `📝 Noted: ${results.join(", ")}`);
}

async function handleMute(message, durationMs = null) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.ModerateMembers])) {
    return reply(message, "❌ You need Moderate Members permission.");
  }

  const users = parseUsers(message);
  if (!users.length) {
    return reply(message, durationMs ? "Usage: =tempmute <duration> @user [@user2 ...] [reason]" : "Usage: =mute @user [@user2 ...] [reason]");
  }

  const reason = parseReason(message, users.length, durationMs ? 1 : 0);

  const me = message.guild.members.me;
  const out = [];

  for (const user of users) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) continue;

    if (!canModerate(me, member)) {
      out.push(`${user.tag} (hierarchy)`);
      continue;
    }

    const timeoutMs = durationMs ?? 28 * 24 * 60 * 60 * 1000; // 28d max
    await member.timeout(timeoutMs, reason).catch(() => {});

    sanctions.addStrike(message.guild.id, user.id, 1);

    out.push(user.tag);

    const embed = logManager.makeModEmbed(durationMs ? "Temp Mute" : "Mute", [
      { name: "User", value: `${user.tag} (${user.id})` },
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Duration", value: durationMs ? `<t:${Math.floor((Date.now() + durationMs) / 1000)}:R>` : "Until unmuted (timeout)", inline: false },
      { name: "Reason", value: reason }
    ], 0xed4245);

    await logManager.log(message.guild, "modlog", embed);
  }

  return reply(message, `🔇 Muted: ${out.join(", ") || "(none)"}`);
}

async function handleUnmute(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.ModerateMembers])) {
    return reply(message, "❌ You need Moderate Members permission.");
  }

  const users = parseUsers(message);
  if (!users.length) return reply(message, "Usage: =unmute @user [reason]");

  const reason = parseReason(message, users.length);
  const me = message.guild.members.me;

  const out = [];
  for (const user of users) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) continue;

    if (!canModerate(me, member)) {
      out.push(`${user.tag} (hierarchy)`);
      continue;
    }

    await member.timeout(null, reason).catch(() => {});
    out.push(user.tag);

    const embed = logManager.makeModEmbed("Unmute", [
      { name: "User", value: `${user.tag} (${user.id})` },
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Reason", value: reason }
    ], 0x57f287);

    await logManager.log(message.guild, "modlog", embed);
  }

  return reply(message, `🔊 Unmuted: ${out.join(", ") || "(none)"}`);
}

async function handleKick(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.KickMembers])) {
    return reply(message, "❌ You need Kick Members permission.");
  }

  const users = parseUsers(message);
  if (!users.length) return reply(message, "Usage: =kick @user [@user2 ...] [reason]");

  const reason = parseReason(message, users.length);
  const me = message.guild.members.me;

  const out = [];
  for (const user of users) {
    const member = await message.guild.members.fetch(user.id).catch(() => null);
    if (!member) continue;

    if (!canModerate(me, member)) {
      out.push(`${user.tag} (hierarchy)`);
      continue;
    }

    await member.kick(reason).catch(() => {});
    sanctions.addStrike(message.guild.id, user.id, 2);
    out.push(user.tag);

    const embed = logManager.makeModEmbed("Kick", [
      { name: "User", value: `${user.tag} (${user.id})` },
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Reason", value: reason }
    ], 0xed4245);

    await logManager.log(message.guild, "modlog", embed);
  }

  return reply(message, `👢 Kicked: ${out.join(", ") || "(none)"}`);
}

async function handleBan(message, durationMs = null) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.BanMembers])) {
    return reply(message, "❌ You need Ban Members permission.");
  }

  const users = parseUsers(message);
  if (!users.length) {
    return reply(message, durationMs ? "Usage: =tempban <duration> @user [@user2 ...] [reason]" : "Usage: =ban @user [@user2 ...] [reason]");
  }

  const reason = parseReason(message, users.length, durationMs ? 1 : 0);

  const out = [];
  for (const user of users) {
    await message.guild.members.ban(user.id, { reason }).catch(() => {});
    sanctions.addStrike(message.guild.id, user.id, 3);
    out.push(user.tag);

    const embed = logManager.makeModEmbed(durationMs ? "Temp Ban" : "Ban", [
      { name: "User", value: `${user.tag} (${user.id})` },
      { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
      { name: "Reason", value: reason }
    ], 0xed4245);

    await logManager.log(message.guild, "modlog", embed);

    if (durationMs) {
      // schedule unban (in-memory only)
      setTimeout(async () => {
        await message.guild.members.unban(user.id, "Tempban expired").catch(() => {});
        const unbanEmbed = logManager.makeModEmbed("Temp Ban Expired", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Reason", value: "Tempban expired" }
        ], 0x57f287);
        await logManager.log(message.guild, "modlog", unbanEmbed);
      }, durationMs).unref?.();
    }
  }

  return reply(message, `⛔ Banned: ${out.join(", ") || "(none)"}`);
}

async function handleUnban(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.BanMembers])) {
    return reply(message, "❌ You need Ban Members permission.");
  }

  const parts = message.content.trim().split(/\s+/);
  const id = parts[1]?.replace(/[<@!>]/g, "");
  if (!id || !/^\d{16,20}$/.test(id)) return reply(message, "Usage: =unban <userId> [reason]");

  const reason = parts.slice(2).join(" ").trim() || "No reason provided";

  await message.guild.members.unban(id, reason).catch(() => {});

  const embed = logManager.makeModEmbed("Unban", [
    { name: "User ID", value: id },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
    { name: "Reason", value: reason }
  ], 0x57f287);

  await logManager.log(message.guild, "modlog", embed);

  return reply(message, `✅ Unbanned: ${id}`);
}

async function handleClear(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.ManageMessages])) {
    return reply(message, "❌ You need Manage Messages permission.");
  }

  const parts = message.content.trim().split(/\s+/);
  const amount = Number(parts[1]);
  if (!amount || amount < 1 || amount > 100) {
    return reply(message, "Usage: =clear <1-100> [reason]");
  }

  const reason = parts.slice(2).join(" ").trim() || "No reason provided";

  const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
  const count = deleted?.size ?? 0;

  const embed = logManager.makeModEmbed("Clear", [
    { name: "Channel", value: `${message.channel}` },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` },
    { name: "Deleted", value: String(count), inline: true },
    { name: "Reason", value: reason }
  ], 0x5865f2);

  await logManager.log(message.guild, "messagelog", embed);
  await logManager.log(message.guild, "modlog", embed);

  return reply(message, `🧹 Cleared ${count} messages.`);
}

async function handleSanctions(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.ModerateMembers])) {
    return reply(message, "❌ You need Moderate Members permission.");
  }

  const users = parseUsers(message);
  if (!users.length) return reply(message, "Usage: =sanctions @user");

  const user = users[0];
  const data = sanctions.getUser(message.guild.id, user.id);

  const embed = new EmbedBuilder()
    .setTitle("📄 Sanctions")
    .setColor(0x5865f2)
    .addFields(
      { name: "User", value: `${user.tag} (${user.id})` },
      { name: "Strikes", value: String(data?.strikes ?? 0), inline: true },
      { name: "Warns", value: String(data?.warns?.length ?? 0), inline: true },
      { name: "Notes", value: String(data?.notes?.length ?? 0), inline: true }
    )
    .setTimestamp();

  const warns = (data?.warns || []).slice(-5).map(w => `• <@${w.modId}>: ${w.reason}`);
  const notes = (data?.notes || []).slice(-5).map(n => `• <@${n.modId}>: ${n.note}`);

  embed.setDescription([
    "**Recent Warns:**",
    warns.length ? warns.join("\n") : "• none",
    "\n**Recent Notes:**",
    notes.length ? notes.join("\n") : "• none"
  ].join("\n"));

  return message.reply({ embeds: [embed] }).catch(() => {});
}

async function handleClearSanctions(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.Administrator])) {
    return reply(message, "❌ You need Administrator permission.");
  }

  const users = parseUsers(message);
  if (!users.length) return reply(message, "Usage: =clear sanctions @user");

  const user = users[0];
  const ok = sanctions.clearSanctions(message.guild.id, user.id);

  const embed = logManager.makeModEmbed("Clear Sanctions", [
    { name: "User", value: `${user.tag} (${user.id})` },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` }
  ], 0x57f287);

  await logManager.log(message.guild, "modlog", embed);

  return reply(message, ok ? `✅ Cleared sanctions for ${user.tag}` : "⚠ No sanctions to clear.");
}

async function handleClearAllSanctions(message) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.Administrator])) {
    return reply(message, "❌ You need Administrator permission.");
  }

  const ok = sanctions.clearAllSanctions(message.guild.id);

  const embed = logManager.makeModEmbed("Clear ALL Sanctions", [
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` }
  ], 0xed4245);

  await logManager.log(message.guild, "modlog", embed);

  return reply(message, ok ? "✅ Cleared all sanctions for this server." : "⚠ No sanctions data found.");
}

async function handleModlogToggle(message, kind, state) {
  if (!requirePerms(message.member, [PermissionsBitField.Flags.Administrator])) {
    return reply(message, "❌ You need Administrator permission.");
  }

  const newCfg = logManager.setGuildConfig(message.guild.id, { [kind]: state });
  await reply(message, `✅ ${kind} is now **${newCfg[kind] ? "ON" : "OFF"}**`);

  const embed = logManager.makeModEmbed("Logging Config Updated", [
    { name: "Type", value: kind, inline: true },
    { name: "State", value: newCfg[kind] ? "ON" : "OFF", inline: true },
    { name: "Moderator", value: `${message.author.tag} (${message.author.id})` }
  ], 0x5865f2);

  await logManager.log(message.guild, "modlog", embed);
}

module.exports = async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const content = message.content.slice(PREFIX.length).trim();
  const [cmd, sub1, sub2] = content.split(/\s+/);
  const command = (cmd || "").toLowerCase();

  try {
    if (command === "warn") return handleWarn(message);
    if (command === "note") return handleNote(message);

    if (command === "mute") return handleMute(message, null);
    if (command === "tempmute") {
      const duration = msFromHuman(sub1);
      if (!duration) return reply(message, "Usage: =tempmute <duration> @user [@user2 ...] [reason]");
      return handleMute(message, duration);
    }
    if (command === "unmute") return handleUnmute(message);

    if (command === "kick") return handleKick(message);
    if (command === "ban") return handleBan(message, null);
    if (command === "tempban") {
      const duration = msFromHuman(sub1);
      if (!duration) return reply(message, "Usage: =tempban <duration> @user [@user2 ...] [reason]");
      return handleBan(message, duration);
    }
    if (command === "unban") return handleUnban(message);

    if (command === "clear") {
      // support: =clear sanctions, =clear all sanctions
      if (String(sub1 || "").toLowerCase() === "sanctions") return handleClearSanctions(message);
      if (String(sub1 || "").toLowerCase() === "all" && String(sub2 || "").toLowerCase() === "sanctions") {
        return handleClearAllSanctions(message);
      }
      return handleClear(message);
    }

    if (command === "sanctions") return handleSanctions(message);

    // server management
    if (command === "lock") return handleLock(message, false);
    if (command === "unlock") return handleUnlock(message, false);
    if (command === "lockall") return handleLock(message, true);
    if (command === "unlockall") return handleUnlock(message, true);
    if (command === "hide") return handleHide(message, false);
    if (command === "unhide") return handleUnhide(message, false);
    if (command === "hideall") return handleHide(message, true);
    if (command === "unhideall") return handleUnhide(message, true);
    if (command === "nick") return handleNick(message);

    // logging toggles
    if (command === "modlog") return handleModlogToggle(message, "modlog", String(sub1).toLowerCase() === "on");
    if (command === "messagelog") return handleModlogToggle(message, "messagelog", String(sub1).toLowerCase() === "on");
    if (command === "voicelog") return handleModlogToggle(message, "voicelog", String(sub1).toLowerCase() === "on");
    if (command === "raidlog") return handleModlogToggle(message, "raidlog", String(sub1).toLowerCase() === "on");

  } catch (e) {
    return reply(message, "❌ Moderation command error");
  }
};
