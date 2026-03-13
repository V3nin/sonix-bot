const scams = [
"discord-gift",
"steamgift",
"nitro-free",
".ru",
"airdrop"
];

module.exports = async (message)=>{

const text = message.content.toLowerCase();

for(const word of scams){

if(text.includes(word)){

await message.delete().catch(()=>{});

message.channel.send(
`⚠ Suspicious link removed from ${message.author}`
);

break;

}

}

};