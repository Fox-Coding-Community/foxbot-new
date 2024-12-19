const { Collection } = require('discord.js');
const config = require('../config.js');
module.exports.run = async (client, interaction) => {
    if (interaction.user.bot) return;

    if (!interaction.isCommand()) return;

    if (!client.commands.has(interaction.commandName)) return;

    let command = client.commands.get(interaction.commandName);
    if (!command) return;

    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
    }
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (parseInt(command.cooldown.replace("s" , "000").replace("m" , "0000"))) //*  1000 || 5000);
    timestamps.has(interaction.user.id) ? await interaction.deferReply({ephemeral: true}) : await interaction.deferReply()
    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now - 5000) /// 1000;
            return interaction.editReply({ content : `> Please wait before using the commmand \`/${interaction.commandName}\` again!` ,  ephemeral: true });
        }
    }
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    await client.commands.get(interaction.commandName).execute(client, interaction);
}