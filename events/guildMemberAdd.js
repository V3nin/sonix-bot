const antiraidAI = require("../systems/antiraidAI");

module.exports = (client)=>{

client.on("guildMemberAdd",member=>{

antiraidAI(member);

});

};