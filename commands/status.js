const { EmbedBuilder } = require("discord.js");

module.exports={

name:"status",

async execute(interaction,client){

const embed = new EmbedBuilder()

.setTitle("⚡ SoniX Status")
.setColor("#57F287")

.addFields(
{name:"Bot",value:"Online",inline:true},
{name:"Servers",value:`${client.guilds.cache.size}`,inline:true},
{name:"Ping",value:`${client.ws.ping}ms`,inline:true}
)

.setTimestamp();

interaction.reply({embeds:[embed]});

}

};