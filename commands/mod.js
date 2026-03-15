const {
  SlashCommandBuilder,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

const logManager = require("../utils/logManager");
const sanctionsStore = require("../utils/sanctionsStore");

function fmtReason(reason) {
  return reason?.trim() || "No reason provided";
}

function ensurePerms(interaction, perms) {
  const member = interaction.member;
  const ok = perms.every(p => member.permissions.has(p));
  if (!ok) {
    interaction.reply({ content: "❌ You don't have permission for that.", ephemeral: true }).catch(() => {});
  }
  return ok;
}

async function safeReply(interaction, payload) {
  if (interaction.replied || interaction.deferred) return interaction.followUp(payload).catch(() => {});
  return interaction.reply(payload).catch(() => {});
}

async function fetchMember(guild, userId) {
  return guild.members.fetch(userId).catch(() => null);
}

function canModerate(me, target) {
  if (!me || !target) return false;
  if (target.id === me.id) return false;
  if (target.id === target.guild.ownerId) return false;
  return me.roles.highest.comparePositionTo(target.roles.highest) > 0;
}

function durationMsFrom(unit, value) {
  const n = Number(value);
  if (!n || n <= 0) return null;
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return mult ? n * mult : null;
}

module.exports = {
  name: "mod",

  data: new SlashCommandBuilder()
    .setName("mod")
    .setDescription("Moderation & management commands")

    // WARN
    .addSubcommand(sc => sc
      .setName("warn")
      .setDescription("Warn a user")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    // NOTE
    .addSubcommand(sc => sc
      .setName("note")
      .setDescription("Add a note to a user")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption(o => o.setName("note").setDescription("Note").setRequired(true))
    )

    // MUTE (timeout)
    .addSubcommand(sc => sc
      .setName("mute")
      .setDescription("Timeout a user (up to 28 days)")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addIntegerOption(o => o.setName("duration").setDescription("Duration value").setMinValue(1).setRequired(true))
      .addStringOption(o => o.setName("unit").setDescription("Duration unit")
        .addChoices(
          { name: "seconds", value: "s" },
          { name: "minutes", value: "m" },
          { name: "hours", value: "h" },
          { name: "days", value: "d" }
        )
        .setRequired(true)
      )
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    .addSubcommand(sc => sc
      .setName("unmute")
      .setDescription("Remove timeout")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    // KICK
    .addSubcommand(sc => sc
      .setName("kick")
      .setDescription("Kick a user")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    // BAN
    .addSubcommand(sc => sc
      .setName("ban")
      .setDescription("Ban a user")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    .addSubcommand(sc => sc
      .setName("tempban")
      .setDescription("Temporarily ban a user (NOTE: unban scheduling will be implemented in the security batch)")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addIntegerOption(o => o.setName("duration").setDescription("Duration value").setMinValue(1).setRequired(true))
      .addStringOption(o => o.setName("unit").setDescription("Duration unit")
        .addChoices(
          { name: "minutes", value: "m" },
          { name: "hours", value: "h" },
          { name: "days", value: "d" }
        )
        .setRequired(true)
      )
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    .addSubcommand(sc => sc
      .setName("unban")
      .setDescription("Unban by user ID")
      .addStringOption(o => o.setName("user_id").setDescription("User ID").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    // CLEAR
    .addSubcommand(sc => sc
      .setName("clear")
      .setDescription("Bulk delete messages")
      .addIntegerOption(o => o.setName("amount").setDescription("1-100").setMinValue(1).setMaxValue(100).setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    // SANCTIONS
    .addSubcommand(sc => sc
      .setName("sanctions")
      .setDescription("Show sanctions for a user")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
    )

    .addSubcommand(sc => sc
      .setName("clear_sanctions")
      .setDescription("Clear sanctions for a user")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
    )

    .addSubcommand(sc => sc
      .setName("clear_all_sanctions")
      .setDescription("Clear all sanctions in this server")
    )

    // LOCK/UNLOCK
    .addSubcommand(sc => sc
      .setName("lock")
      .setDescription("Lock current channel")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    .addSubcommand(sc => sc
      .setName("unlock")
      .setDescription("Unlock current channel")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    .addSubcommand(sc => sc
      .setName("lockall")
      .setDescription("Lock all text channels")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    .addSubcommand(sc => sc
      .setName("unlockall")
      .setDescription("Unlock all text channels")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    // HIDE/UNHIDE
    .addSubcommand(sc => sc
      .setName("hide")
      .setDescription("Hide current channel")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    .addSubcommand(sc => sc
      .setName("unhide")
      .setDescription("Unhide current channel")
      .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(false))
    )

    // NICK
    .addSubcommand(sc => sc
      .setName("nick")
      .setDescription("Change a user's nickname")
      .addUserOption(o => o.setName("user").setDescription("Target user").setRequired(true))
      .addStringOption(o => o.setName("nickname").setDescription("New nickname").setRequired(true))
    )
  ,

  async execute(interaction, client) {
    try {
      sanctionsStore.init();

      const sub = interaction.options.getSubcommand();
      const guild = interaction.guild;
      const me = guild.members.me;

      if (sub === "warn") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ModerateMembers])) return;

        const user = interaction.options.getUser("user", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        sanctionsStore.addWarn(guild.id, user.id, { modId: interaction.user.id, reason });

        const embed = logManager.makeModEmbed("Warn", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Reason", value: reason }
        ], 0xfee75c);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `✅ Warned ${user.tag}` });
      }

      if (sub === "note") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ModerateMembers])) return;

        const user = interaction.options.getUser("user", true);
        const note = fmtReason(interaction.options.getString("note", true));

        sanctionsStore.addNote(guild.id, user.id, { modId: interaction.user.id, note });

        const embed = logManager.makeModEmbed("Note", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Note", value: note }
        ], 0x99aab5);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `📝 Noted ${user.tag}` });
      }

      if (sub === "mute") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ModerateMembers])) return;

        const user = interaction.options.getUser("user", true);
        const durationVal = interaction.options.getInteger("duration", true);
        const unit = interaction.options.getString("unit", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        const ms = durationMsFrom(unit, durationVal);
        if (!ms) return safeReply(interaction, { content: "❌ Invalid duration.", ephemeral: true });

        const member = await fetchMember(guild, user.id);
        if (!member) return safeReply(interaction, { content: "❌ Member not found.", ephemeral: true });
        if (!canModerate(me, member)) return safeReply(interaction, { content: "❌ I can't timeout this member (role hierarchy).", ephemeral: true });

        await member.timeout(ms, reason).catch(() => {});
        sanctionsStore.addStrike(guild.id, user.id, 1, { modId: interaction.user.id, reason: `mute: ${reason}` });

        const embed = logManager.makeModEmbed("Mute", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Duration", value: `<t:${Math.floor((Date.now() + ms) / 1000)}:R>` },
          { name: "Reason", value: reason }
        ], 0xed4245);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `🔇 Timed out ${user.tag}` });
      }

      if (sub === "unmute") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ModerateMembers])) return;

        const user = interaction.options.getUser("user", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        const member = await fetchMember(guild, user.id);
        if (!member) return safeReply(interaction, { content: "❌ Member not found.", ephemeral: true });
        if (!canModerate(me, member)) return safeReply(interaction, { content: "❌ I can't untimeout this member (role hierarchy).", ephemeral: true });

        await member.timeout(null, reason).catch(() => {});

        const embed = logManager.makeModEmbed("Unmute", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Reason", value: reason }
        ], 0x57f287);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `🔊 Unmuted ${user.tag}` });
      }

      if (sub === "kick") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.KickMembers])) return;

        const user = interaction.options.getUser("user", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        const member = await fetchMember(guild, user.id);
        if (!member) return safeReply(interaction, { content: "❌ Member not found.", ephemeral: true });
        if (!canModerate(me, member)) return safeReply(interaction, { content: "❌ I can't kick this member (role hierarchy).", ephemeral: true });

        await member.kick(reason).catch(() => {});
        sanctionsStore.addStrike(guild.id, user.id, 2, { modId: interaction.user.id, reason: `kick: ${reason}` });

        const embed = logManager.makeModEmbed("Kick", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Reason", value: reason }
        ], 0xed4245);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `👢 Kicked ${user.tag}` });
      }

      if (sub === "ban") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.BanMembers])) return;

        const user = interaction.options.getUser("user", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        await guild.members.ban(user.id, { reason }).catch(() => {});
        sanctionsStore.addStrike(guild.id, user.id, 3, { modId: interaction.user.id, reason: `ban: ${reason}` });

        const embed = logManager.makeModEmbed("Ban", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Reason", value: reason }
        ], 0xed4245);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `⛔ Banned ${user.tag}` });
      }

      if (sub === "tempban") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.BanMembers])) return;

        const user = interaction.options.getUser("user", true);
        const durationVal = interaction.options.getInteger("duration", true);
        const unit = interaction.options.getString("unit", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        const ms = durationMsFrom(unit, durationVal);
        if (!ms) return safeReply(interaction, { content: "❌ Invalid duration.", ephemeral: true });

        await guild.members.ban(user.id, { reason: `TEMPBAN: ${reason}` }).catch(() => {});
        sanctionsStore.addStrike(guild.id, user.id, 3, { modId: interaction.user.id, reason: `tempban: ${reason}` });

        const embed = logManager.makeModEmbed("Temp Ban", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Duration", value: `<t:${Math.floor((Date.now() + ms) / 1000)}:R>` },
          { name: "Reason", value: reason }
        ], 0xed4245);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `⛔ Tempbanned ${user.tag} (unban scheduler coming next batch)` });
      }

      if (sub === "unban") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.BanMembers])) return;

        const userId = interaction.options.getString("user_id", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        await guild.members.unban(userId, reason).catch(() => {});

        const embed = logManager.makeModEmbed("Unban", [
          { name: "User ID", value: userId },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Reason", value: reason }
        ], 0x57f287);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `✅ Unbanned ${userId}` });
      }

      if (sub === "clear") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ManageMessages])) return;

        const amount = interaction.options.getInteger("amount", true);
        const reason = fmtReason(interaction.options.getString("reason"));

        const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);
        const count = deleted?.size ?? 0;

        const embed = logManager.makeModEmbed("Clear", [
          { name: "Channel", value: `${interaction.channel}` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Deleted", value: String(count), inline: true },
          { name: "Reason", value: reason }
        ], 0x5865f2);

        await logManager.log(guild, "messagelog", embed);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `🧹 Cleared ${count} messages.` });
      }

      if (sub === "sanctions") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ModerateMembers])) return;

        const user = interaction.options.getUser("user", true);
        const data = sanctionsStore.summary(guild.id, user.id);

        const embed = new EmbedBuilder()
          .setTitle("📄 Sanctions")
          .setColor(0x5865f2)
          .addFields(
            { name: "User", value: `${user.tag} (${user.id})` },
            { name: "Strikes", value: String(data.strikes || 0), inline: true },
            { name: "Warns", value: String(data.warns.length), inline: true },
            { name: "Notes", value: String(data.notes.length), inline: true }
          )
          .setTimestamp();

        const warns = data.warns.slice(0, 5).map(w => `• <@${w.mod_id}>: ${w.reason || "(no reason)"}`);
        const notes = data.notes.slice(0, 5).map(n => `• <@${n.mod_id}>: ${n.reason || "(no note)"}`);

        embed.setDescription([
          "**Recent Warns:**",
          warns.length ? warns.join("\n") : "• none",
          "\n**Recent Notes:**",
          notes.length ? notes.join("\n") : "• none"
        ].join("\n"));

        return safeReply(interaction, { embeds: [embed] });
      }

      if (sub === "clear_sanctions") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.Administrator])) return;

        const user = interaction.options.getUser("user", true);
        const deleted = sanctionsStore.clearUser(guild.id, user.id);

        const embed = logManager.makeModEmbed("Clear Sanctions", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Deleted", value: String(deleted), inline: true }
        ], 0x57f287);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `✅ Cleared sanctions for ${user.tag} (${deleted})` });
      }

      if (sub === "clear_all_sanctions") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.Administrator])) return;

        const deleted = sanctionsStore.clearAllGuild(guild.id);

        const embed = logManager.makeModEmbed("Clear ALL Sanctions", [
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Deleted", value: String(deleted), inline: true }
        ], 0xed4245);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `✅ Cleared all sanctions (${deleted}).` });
      }

      // CHANNEL MGMT
      if (["lock", "unlock", "hide", "unhide"].includes(sub)) {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ManageChannels])) return;

        const reason = fmtReason(interaction.options.getString("reason"));
        const everyone = guild.roles.everyone;

        const patch = {};
        if (sub === "lock") patch.SendMessages = false;
        if (sub === "unlock") patch.SendMessages = null;
        if (sub === "hide") patch.ViewChannel = false;
        if (sub === "unhide") patch.ViewChannel = null;

        await interaction.channel.permissionOverwrites.edit(everyone, patch, { reason }).catch(() => {});

        const embed = logManager.makeModEmbed(sub, [
          { name: "Channel", value: `${interaction.channel}` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Reason", value: reason }
        ], sub === "unlock" || sub === "unhide" ? 0x57f287 : 0xed4245);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `✅ ${sub} applied on ${interaction.channel}` });
      }

      if (["lockall", "unlockall"].includes(sub)) {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ManageChannels])) return;

        await interaction.deferReply({ ephemeral: true }).catch(() => {});

        const reason = fmtReason(interaction.options.getString("reason"));
        const everyone = guild.roles.everyone;

        const chans = guild.channels.cache.filter(c => [0, 5].includes(c.type));
        let ok = 0;
        for (const [, ch] of chans) {
          const patch = { SendMessages: sub === "lockall" ? false : null };
          await ch.permissionOverwrites.edit(everyone, patch, { reason }).catch(() => {});
          ok++;
        }

        const embed = logManager.makeModEmbed(sub, [
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "Channels", value: String(ok), inline: true },
          { name: "Reason", value: reason }
        ], sub === "unlockall" ? 0x57f287 : 0xed4245);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `✅ ${sub} applied on ${ok} channels.` });
      }

      if (sub === "nick") {
        if (!ensurePerms(interaction, [PermissionsBitField.Flags.ManageNicknames])) return;

        const user = interaction.options.getUser("user", true);
        const nickname = interaction.options.getString("nickname", true);

        const member = await fetchMember(guild, user.id);
        if (!member) return safeReply(interaction, { content: "❌ Member not found.", ephemeral: true });
        if (!canModerate(me, member)) return safeReply(interaction, { content: "❌ I can't change this member's nickname (role hierarchy).", ephemeral: true });

        await member.setNickname(nickname, `Nick change by ${interaction.user.tag}`).catch(() => {});

        const embed = logManager.makeModEmbed("Nick", [
          { name: "User", value: `${user.tag} (${user.id})` },
          { name: "Moderator", value: `${interaction.user.tag} (${interaction.user.id})` },
          { name: "New Nick", value: nickname }
        ], 0x5865f2);
        await logManager.log(guild, "modlog", embed);

        return safeReply(interaction, { content: `✅ Nick changed for ${user.tag}.` });
      }

      return safeReply(interaction, { content: "❌ Unknown subcommand.", ephemeral: true });
    } catch (e) {
      return safeReply(interaction, { content: "❌ Mod command error.", ephemeral: true });
    }
  }
};
