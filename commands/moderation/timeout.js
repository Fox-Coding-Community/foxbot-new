const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const LogChannel = require("../../models/LogChannel");

guildId = "300481238773399553";

module.exports = {
    name: "timeout",
    category: "moderation",
    slashCmdData: {
        name: "timeout",
        description: "Remove or add timeout to someone",
        options: [
            {
                name: "add",
                type: 1,
                description: "Add a timeout to a member",
                options: [
                    {
                        name: "member",
                        type: 6,
                        description: "Select the member",
                        required: true,
                    },
                    {
                        name: "duration",
                        type: 3,
                        description:
                            "Duration of the timeout min 1 min, max 14 days",
                        required: true,
                    },
                    {
                        name: "reason",
                        type: 3,
                        description: "Reason for the punishment",
                        required: false,
                    },
                ],
            },
            {
                name: "remove",
                type: 1,
                description: "Remove a timeout from a member",
                options: [
                    {
                        name: "member",
                        type: 6,
                        description: "Select the staff member",
                        required: true,
                    },
                    {
                        name: "reason",
                        type: 3,
                        description: "Reason for the removal",
                        required: false,
                    },
                ],
            },
        ],
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.ModerateMembers],
    botPerms: [PermissionsBitField.Flags.ModerateMembers],
    cooldown: "5s",
    async execute(client, interaction) {
        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.ModerateMembers
            )
        ) {
            return interaction.editReply(
                "> :x: You don't have permission to use this command!"
            );
        }

        const subcommand = interaction.options.getSubcommand();
        const member = interaction.options.getMember("member");
        let duration = interaction.options.getString("duration");
        let reason =
            interaction.options.getString("reason") || "No Reason Provided";

        function parseDuration(duration, interaction) {
            const durationRegex = /^(\d+)([dhm])$/;
            const match = duration.match(durationRegex);

            if (!match) {
                interaction.editReply(
                    "> :x: Invalid duration format! Use `1d`, `1h`, or `1m`."
                );
                return null;
            }

            const value = parseInt(match[1], 10);
            const unit = match[2];

            if (isNaN(value) || value <= 0) {
                interaction.editReply(
                    "> :x: Duration must be a positive number."
                );
                return null;
            }

            let durationMs;

            switch (unit) {
                case "d":
                    durationMs = value * 24 * 60 * 60 * 1000; // Days to milliseconds
                    break;
                case "h":
                    durationMs = value * 60 * 60 * 1000; // Hours to milliseconds
                    break;
                case "m":
                    durationMs = value * 60 * 1000; // Minutes to milliseconds
                    break;
                default:
                    interaction.editReply(
                        "> :x: Invalid duration unit! Use `d`, `h`, or `m`."
                    );
                    return null;
            }

            if (
                durationMs < 60 * 1000 ||
                durationMs > 14 * 24 * 60 * 60 * 1000
            ) {
                interaction.editReply(
                    "> :x: Duration must be between 1 minute (1m) and 14 days (14d)."
                );
                return null;
            }

            return durationMs;
        }

        const logChannel = await LogChannel.findOne({ guildId });
        const timeout_channel = logChannel
            ? interaction.guild.channels.cache.get(logChannel.timeout_channelId)
            : null;

        if (subcommand === "add") {
            if (member.id === interaction.user.id) {
                return interaction.editReply(
                    "> :x: You cannot timeout yourself!"
                );
            } else if (member.id === client.user.id) {
                return interaction.editReply("> :x: I cannot timeout myself!");
            } else if (!member) {
                return interaction.editReply("> :x: Invalid member!");
            } else if (
                member.roles.highest.position >=
                interaction.member.roles.highest.position
            ) {
                return interaction.editReply(
                    "> :x: You cannot timeout a member with a higher role than you!"
                );
            } else if (
                member.communicationDisabledUntilTimestamp &&
                member.communicationDisabledUntilTimestamp > Date.now()
            ) {
                return interaction.editReply(
                    `> :x: ${member.user} Is already in a timeout!`
                );
            }

            const parsedDuration = parseDuration(duration, interaction);
            if (!parsedDuration) {
                return;
            }
            member
                .timeout(parsedDuration, reason)
                .then(() => {
                    interaction.editReply(
                        `> :white_check_mark: ${member.user} Has been put on a timeout for **${duration}**!`
                    );
                })
                .catch((error) => {
                    console.error(error);
                    interaction.editReply(
                        "> :x: An error occurred while applying the timeout."
                    );
                });

            if (timeout_channel) {
                const timeoutEmbed = new EmbedBuilder()
                    .addFields(
                        {
                            name: "Member",
                            value: `${member.user}`,
                            inline: true,
                        },
                        {
                            name: "Admin",
                            value: `${interaction.user}`,
                            inline: true,
                        },
                        {
                            name: "Duration",
                            value: `${duration}`,
                            inline: true,
                        },
                        {
                            name: "Reason",
                            value: `\`${reason}\``,
                            inline: true,
                        }
                    )
                    .setColor("Red")
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp()
                    .setAuthor({
                        name: "Timeout Added",
                        iconURL: interaction.user.displayAvatarURL(),
                    });

                await timeout_channel.send({ embeds: [timeoutEmbed] });
            }
        } else if (subcommand === "remove") {
            if (member.id === client.user.id) {
                return interaction.editReply("> :x: I cannot timeout myself!");
            } else if (!member) {
                return interaction.editReply("> :x: Invalid member!");
            } else if (
                member.roles.highest.position >=
                interaction.member.roles.highest.position
            ) {
                return interaction.editReply(
                    "> :x: You cannot remove a timeout from a member with a higher role than you!"
                );
            } else if (
                !member.communicationDisabledUntilTimestamp ||
                member.communicationDisabledUntilTimestamp < Date.now()
            ) {
                return interaction.editReply(
                    `> :x: ${member.user} Is not in a timeout!`
                );
            }

            member
                .timeout(null, reason)
                .then(() => {
                    interaction.editReply(
                        `> :white_check_mark: ${member.user} Has been removed from timeout!`
                    );
                })
                .catch((error) => {
                    console.error(error);
                    interaction.editReply(
                        "> :x: An error occurred while removing the timeout."
                    );
                });

            if (timeout_channel) {
                const timeoutEmbed = new EmbedBuilder()
                    .addFields(
                        {
                            name: "Member",
                            value: `${member.user}`,
                            inline: true,
                        },
                        {
                            name: "Admin",
                            value: `${interaction.user}`,
                            inline: true,
                        },
                        {
                            name: "Reason",
                            value: `\`${reason}\``,
                            inline: true,
                        }
                    )
                    .setColor("Green")
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp()
                    .setAuthor({
                        name: "Timeout Removed",
                        iconURL: interaction.user.displayAvatarURL(),
                    });

                await timeout_channel.send({ embeds: [timeoutEmbed] });
            }
        }
    },
};
