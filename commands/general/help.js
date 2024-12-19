const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
    name: "help",
    category: "general",
    slashCmdData: {
        name: "help",
        description: "Get help with all available commands",
        options: [
            {
                name: "command",
                description: "The command you want help with",
                type: 3,
                required: false
            },
        ]
    },
    devOnly: false,
    usrPerms: [],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        const commandName = interaction.options.getString("command");
        let commandInfo = null;

        if (commandName) {
            commandInfo = client.commands.find(x => x.name.toLowerCase() === commandName.toLowerCase());
        }
        if(!client.commands.has(commandName) && commandInfo !== null) {
            return interaction.editReply({ content: `> :x: \`${commandName}\` is not a command!` });
        }

        let embed = new EmbedBuilder()
            .setAuthor({ name: `Commands Help • Count: ${client.commands.size}`, iconURL: `${client.user.displayAvatarURL({ dynamic: true })}` })
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setImage("https://cdn.discordapp.com/attachments/829124514629681172/1296576673151586344/Background_copy.png?ex=6712caa0&is=67117920&hm=de200e390beccdde61d9a0b6041b0c279b216e65cc7ce2029c46902589500812&")
            .setColor(client.color)
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

       
        if (!commandInfo) {
            embed.addFields(
                {
                    name: `> Commands`,
                    value: `${client.commands.map((x) => x.name).join(", \n")}`,
                },
                {
                    name: "> Help with a specific command",
                    value: `Use the command \`/help [command]\` entering the command name to get help with it.`,
                }
            );
        } else {
           
            let commandUsage = `\`/${commandInfo.slashCmdData.name}\``;

            
            if (commandInfo.slashCmdData.options && commandInfo.slashCmdData.options.length > 0) {
                const optionsList = commandInfo.slashCmdData.options.map(option => {
                    return `\`${option.name}${option.required ? "" : " [optional]" }\``; 
                });
                commandUsage += ` ${optionsList.length > 0 ? `[${optionsList.join(", ")}]` : ""}`;
            }

            
            if(commandInfo.usrPerms == "8") commandInfo.usrPerms = "Administrator";
              if(commandInfo.usrPerms == "4194304") commandInfo.usrPerms = "Mute Members"
            if(commandInfo.usrPerms == "1099511627776") commandInfo.usrPerms = "Moderate Members";
            if(commandInfo.usrPerms == "") commandInfo.usrPerms = "None";
            embed.addFields(
                {
                    name: `> ${commandInfo.name.toUpperCase()} Command`,
                    value: `${commandInfo.slashCmdData.description}`,
                },
                {
                    name: "> Required Permissions",
                    value: `\`${commandInfo.usrPerms}\``,
                },
                {
                    name: "> Usage",
                    value: commandUsage,
                }
            );
        }

       
        await interaction.editReply({ embeds: [embed] });
    }
};
