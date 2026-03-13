require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

new SlashCommandBuilder()
.setName("status")
.setDescription("Show bot status"),

new SlashCommandBuilder()
.setName("security")
.setDescription("Show server security score"),

new SlashCommandBuilder()
.setName("audit")
.setDescription("Audit server security"),

new SlashCommandBuilder()
.setName("scan")
.setDescription("Scan a user")
.addUserOption(option =>
option.setName("user")
.setDescription("User to scan")
.setRequired(true)
)

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

try {

console.log("Deploying global commands...");

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{ body: commands }
);

console.log("Global commands deployed.");

} catch (error) {
console.error(error);
}

})();