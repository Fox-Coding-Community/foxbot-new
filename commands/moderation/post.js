const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const UserMessageCount = require("../../models/UserMessageCount");
const LogChannel = require("../../models/LogChannel");

module.exports = {
    name: "post",
    description: "Post the monthly points for staff and event",
    category: "moderation",
    slashCmdData: {
        name: "post",
        description: "Post the monthly points for staff and event",
        options: [
            {
                name: "type",
                description: "Type of the post",
                type: 3,
                required: true,
                choices: [
                    {
                        name: "Staff",
                        value: "staff",
                    },
                    {
                        name: "Event",
                        value: "event",
                    },
                ],
            },
        ],
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.Administrator],
    botPerms: [],
    cooldown: "5s",
    async execute(client, interaction) {
        const type = interaction.options.getString("type");

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return interaction.editReply(
                "> :x: You don't have permission to use this command!"
            );
        }

        if (type === "staff") {
            const points = await UserMessageCount.find({
                staffRole: true,
            }).sort({
                staffPoint: -1,
            });

            if (!points) {
                return interaction.editReply({
                    content: `> :x: No data found for staff!`,
                });
            }

            const logChannel = await LogChannel.findOne({
                guildId: interaction.guild.id,
            });
            const point_channel = interaction.guild.channels.cache.get(
                logChannel.points_channelId
            );
            if (!point_channel)
                return interaction.editReply("The points channel is not set!");

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: "Staff Final Points",
                    iconURL: interaction.guild.iconURL(),
                })
                .setColor(client.color)
                .setTimestamp()
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(
                    `${points.map(
                        (user, index) =>
                            `${index + 1}. <@${
                                user.userId
                            }> - **${user.staffPoint.toFixed(4)}** points\n`
                    )}`
                )
                .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            await interaction.editReply({
                content: `> :white_check_mark: Successfully posted to ${point_channel}!`,
            });
            await point_channel.send({ embeds: [embed] });
        }
        if (type === "event") {
            const points = await UserMessageCount.find({
                eventRole: true,
            }).sort({
                eventPoint: -1,
            });

            if (!points) {
                return interaction.editReply({
                    content: `> :x: No data found for events!`,
                });
            }

            const logChannel = await LogChannel.findOne({
                guildId: interaction.guild.id,
            });
            const point_channel = interaction.guild.channels.cache.get(
                logChannel.points_channelId
            );
            if (!point_channel)
                return interaction.editReply("The points channel is not set!");

            const embed = new EmbedBuilder()
                .setAuthor({
                    name: "Event Final Points",
                    iconURL: interaction.guild.iconURL(),
                })
                .setColor(client.color)
                .setTimestamp()
                .setThumbnail(interaction.guild.iconURL())
                .setDescription(
                    `${points.map(
                        (user, index) =>
                            `${index + 1}. <@${
                                user.userId
                            }> - **${user.eventPoint.toFixed(4)}** points\n`
                    )}`
                )
                .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });

            await interaction.editReply({
                content: `> :white_check_mark: Successfully posted to ${point_channel}!`,
            });
            await point_channel.send({ embeds: [embed] });
        }
    },
};
