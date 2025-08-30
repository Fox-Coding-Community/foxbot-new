const { MessageEmbed, MessageAttachment } = require("discord.js");
const config = require("../config.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

module.exports.run = async (client) => {
    console.log(`[ ${client.user.tag}] : ONLINE`);

    const commands = client.commands.toJSON();

    let arr = [];
    for (let i = 0; i < commands.length; i++) {
        const command = require(`../commands/${commands[i].category}/${commands[i].name}`);
        arr.push(command.slashCmdData);
    }

    const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

    (async () => {
        try {
            await rest.put(Routes.applicationCommands(client.user.id), {
                body: arr,
            });
            console.log("[ Commands ]: Pushed");
            console.log(`Pushed commands: ${commands.length}}`);
        } catch (error) {
            console.error(error);
        }
    })();
};
