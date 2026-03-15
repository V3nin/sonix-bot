const {
  ChannelType,
  PermissionsBitField,
  EmbedBuilder
} = require("discord.js");

const { readJson, writeJson } = require("./storage");

const DEFAULTS = {
  modlog: true,
  messagelog: false,
  voicelog: false,
  raidlog: true,
  rolelog: false,
  boostlog: false
};

function getGuildConfig(guildId) {
  const all = readJson("guildConfig", {});
  if (!all[guildId]) all[guildId] = { ...DEFAULTS };
  return all[guildId];
}

function setGuildConfig(guildId, patch) {
  const all = readJson("guildConfig", {});
  const current = all[guildId] || { ...DEFAULTS };
  all[guildId] = { ...current, ...patch };
  writeJson("guildConfig", all);
  return all[guildId];
}

async function ensureLogChannel(guild) {
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.name === "sonix-logs"
  );

  if (existing) return existing;

  // Try create
  try {
    const me = guild.members.me;
    if (
      !me?.permissions.has(PermissionsBitField.Flags.ManageChannels) ||
      !me?.permissions.has(PermissionsBitField.Flags.ViewChannel)
    ) {
      return null;
    }

    const channel = await guild.channels.create({
      name: "sonix-logs",
      type: ChannelType.GuildText,
      reason: "SoniX logging channel"
    });

    return channel;
  } catch {
    return null;
  }
}

function isEnabled(guildId, kind) {
  const cfg = getGuildConfig(guildId);
  return !!cfg[kind];
}

async function log(guild, kind, embedOrContent) {
  try {
    if (!isEnabled(guild.id, kind)) return;

    const channel = await ensureLogChannel(guild);
    if (!channel) return;

    if (typeof embedOrContent === "string") {
      await channel.send({ content: embedOrContent }).catch(() => {});
    } else {
      await channel.send({ embeds: [embedOrContent] }).catch(() => {});
    }
  } catch {
    // swallow
  }
}

function makeModEmbed(action, fields = [], color = 0x5865f2) {
  const embed = new EmbedBuilder()
    .setTitle(`🛡️ ${action}`)
    .setColor(color)
    .setTimestamp();

  if (fields.length) embed.addFields(fields);
  return embed;
}

module.exports = {
  getGuildConfig,
  setGuildConfig,
  ensureLogChannel,
  log,
  makeModEmbed
};
