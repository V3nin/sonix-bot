module.exports = (user)=>{

const ageDays = Math.floor(
(Date.now()-user.createdTimestamp)/(1000*60*60*24)
);

let riskScore = 0;
let flags = [];

if(ageDays < 3){

riskScore += 60;
flags.push("Very new account");

}
else if(ageDays < 7){

riskScore += 40;
flags.push("Recent account");

}

if(user.bot){

riskScore += 30;
flags.push("Bot account");

}

let riskLevel = "LOW";

if(riskScore >=70) riskLevel="HIGH";
else if(riskScore >=40) riskLevel="MEDIUM";

if(flags.length===0)
flags.push("No suspicious indicators");

return {ageDays,riskScore,riskLevel,flags};

};