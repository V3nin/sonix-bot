const config = require("../config/config");

const users = new Map();

module.exports = async (message)=>{

const user = message.author.id;
const now = Date.now();

if(!users.has(user)) users.set(user,[]);

const timestamps = users.get(user);

timestamps.push(now);

const recent = timestamps.filter(t=> now-t < config.spamWindow);

users.set(user,recent);

if(recent.length >= config.spamLimit){

const messages = await message.channel.messages.fetch({limit:100});

const userMsgs = messages.filter(m=>
m.author.id===user &&
(now-m.createdTimestamp)<120000
);

userMsgs.forEach(m=>m.delete().catch(()=>{}));

const member = await message.guild.members.fetch(user);

await member.timeout(config.muteTime,"Spam detected");

message.channel.send(`⚠ ${message.author} muted for spam`);

}

};