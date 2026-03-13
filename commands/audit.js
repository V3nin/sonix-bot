const { EmbedBuilder } = require("discord.js");
const checks = require("../utils/securityChecks");

module.exports={

name:"audit",

async execute(interaction){

await interaction.reply({
content:"🔍 Running security audit..."
});

const result = checks(interaction.guild);

const embed = new EmbedBuilder()

.setTitle("⚡ SoniX Security Audit")
.setColor("#5865F2")

.setDescription(result.issues.join("\n"))

.addFields({
name:"Security Score",
value:`${result.score}/100`
})

.setTimestamp();

interaction.editReply({embeds:[embed]});

}

};