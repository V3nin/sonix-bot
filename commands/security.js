const { EmbedBuilder } = require("discord.js");
const checks = require("../utils/securityChecks");

module.exports={

name:"security",

async execute(interaction){

await interaction.reply({
content:"⚡ SoniX analyzing server..."
});

const result = checks(interaction.guild);

let grade="F";

if(result.score>=95) grade="A+";
else if(result.score>=85) grade="A";
else if(result.score>=70) grade="B";
else if(result.score>=50) grade="C";
else grade="D";

const barLength = 20;
const filled = Math.round((result.score/100)*barLength);

const bar="🟩".repeat(filled)+"⬜".repeat(barLength-filled);

const embed = new EmbedBuilder()

.setTitle("⚡ SoniX Security Score")
.setColor("#5865F2")

.addFields(
{name:"Score",value:`${result.score}/100`,inline:true},
{name:"Grade",value:grade,inline:true},
{name:"Protection",value:bar}
)

.setDescription(result.issues.join("\n"))

.setTimestamp();

interaction.editReply({embeds:[embed]});

}

};