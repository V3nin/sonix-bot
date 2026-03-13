const { PermissionsBitField } = require("discord.js");

module.exports = (guild)=>{

let score = 100;
let issues = [];

const everyone = guild.roles.everyone;

if(everyone.permissions.has(
PermissionsBitField.Flags.MentionEveryone
)){
score -= 15;
issues.push("Everyone role can mention everyone");
}

const bots = guild.members.cache.filter(m=>m.user.bot);

bots.forEach(bot=>{

if(bot.permissions.has(PermissionsBitField.Flags.Administrator)){

score -=20;
issues.push(`Bot admin : ${bot.user.tag}`);

}

});

if(guild.verificationLevel === 0){

score -=10;
issues.push("Verification level disabled");

}

if(issues.length===0)
issues.push("No major issues");

return {score,issues};

};