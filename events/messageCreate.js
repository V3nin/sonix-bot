const antispam = require("../systems/antispam");
const scamdetect = require("../systems/scamdetect");

module.exports = (client)=>{

client.on("messageCreate",async message=>{

if(message.author.bot) return;

antispam(message);
scamdetect(message);

});

};