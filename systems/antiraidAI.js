const config = require("../config/config");

const raidData = new Map();

module.exports = (member)=>{

const guildId = member.guild.id;
const now = Date.now();

if(!raidData.has(guildId))
raidData.set(guildId,[]);

const joins = raidData.get(guildId);

joins.push(now);

const recent = joins.filter(t=> now-t < config.raidWindow);

raidData.set(guildId,recent);

if(recent.length >= config.raidJoinLimit){

member.guild.systemChannel?.send(
"🚨 SoniX AI detected a potential raid"
);

}

};