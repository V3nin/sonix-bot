const { PermissionsBitField, ChannelType } = require("discord.js");

function reply(message, content) {
  return message.reply({ content }).catch(() => {});
}

function canManageChannels(member) {
  return member?.permissions?.has(PermissionsBitField.Flags.ManageChannels);
}

function canManageRoles(member) {
  return member?.permissions?.has(PermissionsBitField.Flags.ManageRoles);
}

function canManageNick(member) {
  return member?.permissions?.has(PermissionsBitField.Flags.ManageNicknames);
}

function isTextChannel(channel) {
  return channel && [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(channel.type);
}

async function setChannelLocked(channel, locked, reason = "SoniX lock") {
  if (!isTextChannel(channel)) return false;

  const everyone = channel.guild.roles.everyone;
  const overwrite = channel.permissionOverwrites.cache.get(everyone.id);
  const current = overwrite?.deny?.has(PermissionsBitField.Flags.SendMessages) || false;

  if (locked && current) return true;
  if (!locked && !current) return true;

  await channel.permissionOverwrites.edit(
    everyone,
    { SendMessages: locked ? false : null },
    { reason }
  ).catch(() => {});

  return true;
}

async function setChannelHidden(channel, hidden, reason = "SoniX hide") {
  const everyone = channel.guild.roles.everyone;
  await channel.permissionOverwrites.edit(
    everyone,
    { ViewChannel: hidden ? false : null },
    { reason }
  ).catch(() => {});

  return true;
}

module.exports = {
  reply,
  canManageChannels,
  canManageRoles,
  canManageNick,
  setChannelLocked,
  setChannelHidden
};
