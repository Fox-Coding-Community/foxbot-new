const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const LogChannel = require("../../models/LogChannel");

module.exports = {
    name: "channel",
    category: "moderation",
    slashCmdData: {
        name: "channel",
        description: "Set a channel as log channel",
        options: [
            {
                name: "punishments",
                description:
                    "The channel you want to set as log for punishments",
                type: 1,
                options: [
                    {
                        name: "channel",
                        description:
                            "The channel you want to set as log for punishments",
                        type: 7,
                        required: true,
                    },
                ],
            },
            {
                name: "vacations",
                description: "The channel you want to set as log for vacations",
                type: 1,
                options: [
                    {
                        name: "channel",
                        description:
                            "The channel you want to set as log for vacations",
                        type: 7,
                        required: true,
                    },
                ],
            },
            {
                name: "mutes",
                description: "The channel you want to set as log for mutes",
                type: 1,
                options: [
                    {
                        name: "channel",
                        description:
                            "The channel you want to set as log for mutes",
                        type: 7,
                        required: true,
                    },
                ],
            },
            {
                name: "timeouts",
                description: "The channel you want to set as log for timeouts",
                type: 1,
                options: [
                    {
                        name: "channel",
                        description:
                            "The channel you want to set as log for timeouts",
                        type: 7,
                        required: true,
                    },
                ],
            },
            {
                name: "warns",
                description: "The channel you want to set as log for warns",
                type: 1,
                options: [
                    {
                        name: "channel",
                        description:
                            "The channel you want to set as log for warns",
                        type: 7,
                        required: true,
                    },
                ],
            },
            {
                name: "points",
                description: "The channel you want to set as log for points",
                type: 1,
                options: [
                    {
                        name: "channel",
                        description:
                            "The channel you want to set as log for points",
                        type: 7,
                        required: true,
                    },
                ],
            },
        ],
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.Administrator],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        let subcommand = interaction.options.getSubcommand();

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return interaction.editReply(
                "> :x: You don't have permission to use this command!"
            );
        }

        const channel = interaction.options.getChannel("channel");

        if (channel.type !== 0) {
            return interaction.editReply(
                "> :x: Please select a valid text channel!"
            );
        }

        if (subcommand === "punishments") {
            await LogChannel.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { punishment_channelId: channel.id },
                { upsert: true }
            );
            interaction.editReply(
                `> :white_check_mark: Successfully set ${channel} as punishments log channel!`
            );
        } else if (subcommand === "vacations") {
            await LogChannel.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { vacation_channelId: channel.id },
                { upsert: true }
            );
            interaction.editReply(
                `> :white_check_mark: Successfully set ${channel} as vacations log channel!`
            );
        } else if (subcommand === "mutes") {
            await LogChannel.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { mute_channelId: channel.id },
                { upsert: true }
            );
            interaction.editReply(
                `> :white_check_mark: Successfully set ${channel} as mutes log channel!`
            );
        } else if (subcommand === "timeouts") {
            await LogChannel.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { timeout_channelId: channel.id },
                { upsert: true }
            );
            interaction.editReply(
                `> :white_check_mark: Successfully set ${channel} as timeouts log channel!`
            );
        } else if (subcommand === "warns") {
            await LogChannel.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { warn_channelId: channel.id },
                { upsert: true }
            );
            interaction.editReply(
                `> :white_check_mark: Successfully set ${channel} as warns log channel!`
            );
        } else if (subcommand === "points") {
            await LogChannel.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { point_channelId: channel.id },
                { upsert: true }
            );
            interaction.editReply(
                `> :white_check_mark: Successfully set ${channel} as points log channel!`
            );
        }
    },
};
