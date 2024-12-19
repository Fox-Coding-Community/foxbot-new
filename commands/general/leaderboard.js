const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const mongoose = require("mongoose");
const UserMessageCount = require("../../models/UserMessageCount");

module.exports = {
    name: "leaderboard",
    category: "general",
    slashCmdData: {
        name: "leaderboard",
        description: "Displays a leaderboard of staff members' points/messages",
        options: [
            {
                name: "staff",
                description: "Staff leaderboard",
                type: 1, // Type 1 is for subcommands
                options: [
                    {
                        name: "type",
                        description: "Select the type of leaderboard",
                        type: 3, // Type 3 is for string choices
                        required: true,
                        choices: [
                            { name: "Points", value: "Points" },
                            { name: "Messages", value: "Messages" },
                        ],
                    },
                ],
            },
            {
                name: "events",
                description: "Events leaderboard",
                type: 1, // Type 1 is for subcommands
                options: [
                    {
                        name: "type",
                        description: "Select the type of leaderboard",
                        type: 3, // Type 3 is for string choices
                        required: true,
                        choices: [
                            { name: "Points", value: "Points" },
                            { name: "Messages", value: "Messages" },
                        ],
                    },
                ],
            },
        ],
    },
    devOnly: false,
    usrPerms: [],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "staff") {
            const type = interaction.options.getString("type");

            if (type === "Points") {
                const leaderboardex = await UserMessageCount.find().sort({
                    staffPoint: -1,
                });

                const leaderboard = leaderboardex.filter(
                    (user) => user.staffPoint > 0
                );

                if (leaderboard.length === 0) {
                    await interaction.editReply(
                        "> :x: No staff members found."
                    );
                }

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Staff Points Leaderboard",
                        iconURL: `${client.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setThumbnail(
                        interaction.guild.iconURL({ dynamic: true, size: 1024 })
                    )
                    .setColor(client.color)
                    .setDescription(
                        leaderboard
                            .map(
                                (user, index) =>
                                    `${index + 1}. <@${
                                        user.userId
                                    }> - **${user.staffPoint.toFixed(
                                        4
                                    )} points**`
                            )
                            .join("\n")
                    )
                    .setFooter({
                        text: "Highest to lowest",
                        iconURL: `${interaction.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    });

                await interaction.editReply({ embeds: [embed] });
            } else if (type === "Messages") {
                const leaderboardex = await UserMessageCount.find().sort({
                    staffMessage: -1,
                });

                const leaderboard = leaderboardex.filter(
                    (user) => user.staffMessage > 0
                );

                if (leaderboard.length === 0) {
                    await interaction.editReply(
                        "> :x: No staff members found."
                    );
                }

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Staff Messages Leaderboard",
                        iconURL: `${client.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setThumbnail(
                        interaction.guild.iconURL({ dynamic: true, size: 1024 })
                    )
                    .setColor(client.color)
                    .setDescription(
                        leaderboard
                            .map(
                                (user, index) =>
                                    `${index + 1}. <@${user.userId}> - **${
                                        user.staffMessage
                                    } messages**`
                            )
                            .join("\n")
                    )
                    .setFooter({
                        text: "Highest to lowest",
                        iconURL: `${interaction.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    });

                await interaction.editReply({ embeds: [embed] });
            }
        }

        if (subcommand === "events") {
            const type = interaction.options.getString("type");

            if (type === "Points") {
                const leaderboardex = await UserMessageCount.find().sort({
                    eventPoint: -1,
                });

                const leaderboard = leaderboardex.filter(
                    (user) => user.eventPoint > 0
                );

                if (leaderboard.length === 0) {
                    return interaction.editReply(":x: No events points found.");
                }

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Events Points Leaderboard",
                        iconURL: `${client.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setThumbnail(
                        interaction.guild.iconURL({ dynamic: true, size: 1024 })
                    )
                    .setColor(client.color)
                    .setDescription(
                        leaderboard
                            .map(
                                (user, index) =>
                                    `${index + 1}. <@${
                                        user.userId
                                    }> - **${user.eventPoint.toFixed(
                                        4
                                    )} points**`
                            )
                            .join("\n")
                    )
                    .setFooter({
                        text: "Highest to lowest",
                        iconURL: `${interaction.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    });

                await interaction.editReply({ embeds: [embed] });
            } else if (type === "Messages") {
                const leaderboardex = await UserMessageCount.find().sort({
                    eventMessage: -1,
                });

                const leaderboard = leaderboardex.filter(
                    (user) => user.eventMessage > 0
                );

                if (leaderboard.length === 0) {
                    await interaction.editReply(
                        "> :x: No events messages found."
                    );
                }

                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Events Messages Leaderboard",
                        iconURL: `${client.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setThumbnail(
                        interaction.guild.iconURL({ dynamic: true, size: 1024 })
                    )
                    .setColor(client.color)
                    .setDescription(
                        leaderboard
                            .map(
                                (user, index) =>
                                    `${index + 1}. <@${user.userId}> - **${
                                        user.eventMessage
                                    } messages**`
                            )
                            .join("\n")
                    )
                    .setFooter({
                        text: "Highest to lowest",
                        iconURL: `${interaction.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    });

                await interaction.editReply({ embeds: [embed] });
            }
        }
    },
};
