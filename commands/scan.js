const { EmbedBuilder } = require("discord.js");
const riskEngine = require("../utils/riskEngine");

module.exports={

name:"scan",

async execute(interaction){

await interaction.reply({
content:"🔎 SoniX scanning user..."
});

const user = interaction.options.getUser("user");

const result = riskEngine(user);

const embed = new EmbedBuilder()

.setTitle("🔎 User Scan")
.setColor("#5865F2")

.addFields(
{name:"User",value:user.tag},
{name:"Account age",value:`${result.ageDays} days`},
{name:"Risk score",value:`${result.riskScore}/100`},
{name:"Risk level",value:result.riskLevel}
)

.setDescription(result.flags.join("\n"))

.setTimestamp();

interaction.editReply({embeds:[embed]});

}

};