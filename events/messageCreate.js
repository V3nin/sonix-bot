const antispam = require("../systems/antispam");
const scamdetect = require("../systems/scamdetect");
const prefixModeration = require("../systems/prefixModeration");

module.exports = (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // Prefix moderation system
    await prefixModeration(message);

    // Security systems
    antispam(message);
    scamdetect(message);
  });
};
