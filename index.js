require("dotenv").config();

const fs = require("fs");
const { Client, GatewayIntentBits, Collection } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

/* LOAD COMMANDS */

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

/* LOAD EVENTS */

const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  event(client);
}

/* BOT READY */

client.once("ready", () => {
  console.log(`⚡ SoniX Online : ${client.user.tag}`);
});

/* ERROR HANDLING */

client.on("error", console.error);
client.on("warn", console.warn);

/* LOGIN */

client.login(process.env.TOKEN);