module.exports = (client)=>{

client.on("interactionCreate",async interaction=>{

if(!interaction.isChatInputCommand()) return;

const command = client.commands.get(interaction.commandName);

if(!command) return;

try{

await command.execute(interaction,client);

}catch(error){

console.error(error);

interaction.reply({
content:"❌ Command error",
ephemeral:true
});

}

});

};