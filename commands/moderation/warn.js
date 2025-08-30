const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const LogChannel = require("../../models/LogChannel");
const UserMessageCount = require("../../models/UserMessageCount");

const firstWarn = "1080918072065527828";
const secondWarn = "1068466065719447562";

module.exports = {
    name: "warn",
    category: "moderation",
    slashCmdData: {
        name: "warn",
        description: "Warn a staff member",
        options: [
            {
                name: "member",
                type: 6, // Type 6 = USER
                description: "Select the staff member",
                required: true,
            },
            {
                name: "reason",
                type: 3, // Type 3 = STRING
                description: "Reason for the warn",
                required: false,
            },
        ],
    },
    devOnly: false,
    usrPerms: [], // Add user permissions if required
    botPerms: [PermissionsBitField.Flags.ManageRoles],
    cooldown: "5s",
    async execute(client, interaction) {
        try {
            const member = interaction.options.getMember("member");

            if (member.user.id === interaction.user.id) {
                return interaction.editReply("> :x: You cannot warn yourself!");
            }

            // Fetch log channel configuration
            const logChannelConfig = await LogChannel.findOne({
                guildId: interaction.guild.id,
            });
            const warn_channel = logChannelConfig
                ? await client.channels
                      .fetch(logChannelConfig.warn_channelId)
                      .catch(() => null)
                : null;

            if (member.user.bot) {
                return interaction.editReply("> :x: You cannot warn a bot!");
            }

            const reason =
                interaction.options.getString("reason") || "No reason provided";
            const author = interaction.guild.members.cache.get(
                interaction.user.id
            );

            if (
                !author?.roles.cache.some(
                    (role) => role.id === client.highStaffRole
                )
            ) {
                return interaction.editReply(
                    "> :x: You must be a high staff to perform this action!"
                );
            }

            if (
                !member.roles.cache.some(
                    (role) => role.id === client.staffRole
                ) ||
                !member.roles.cache.some((role) => role.id === client.eventRole)
            ) {
                return interaction.editReply(
                    "> :x: The selected member is not a staff or event member!"
                );
            }

            const userId = member.user.id;
            let userPoints = await UserMessageCount.findOne({ userId });

            if (!userPoints) {
                if (
                    member.roles.cache.some(
                        (role) => role.id === client.staffRole
                    )
                ) {
                    userPoints = new UserMessageCount({
                        userId: userId,
                        staffRole: true,
                        staffMessage: 0,
                        staffPoint: 0,
                        lastUpdated: Date.now(),
                    });
                } else if (
                    member.roles.cache.some(
                        (role) => role.id === client.eventRole
                    )
                ) {
                    userPoints = new UserMessageCount({
                        userId: userId,
                        eventRole: true,
                        eventMessage: 0,
                        eventPoint: 0,
                        lastUpdated: Date.now(),
                    });
                } else if (
                    member.roles.cache.some(
                        (role) => role.id === client.staffRole
                    ) &&
                    member.roles.cache.some(
                        (role) => role.id === client.eventRole
                    )
                ) {
                    userPoints = new UserMessageCount({
                        userId: userId,
                        staffRole: true,
                        eventRole: true,
                        staffMessage: 0,
                        eventMessage: 0,
                        staffPoint: 0,
                        eventPoint: 0,
                        lastUpdated: Date.now(),
                    });
                }
            }

            const amountToTake = 0.025;
            let addedRoles = [];

            if (
                userPoints.staffPoint === 0 ||
                userPoints.eventPoint === 0 ||
                userPoints.staffPoint < amountToTake ||
                userPoints.eventPoint < amountToTake
            ) {
                // Add the first warn role if not already present
                if (!member.roles.cache.has(firstWarn)) {
                    await member.roles.add(firstWarn);
                    addedRoles.push(`<@&${firstWarn}>`);
                } else if (
                    member.roles.cache.has(firstWarn) &&
                    !member.roles.cache.has(secondWarn)
                ) {
                    // Add the second warn role if the first warn exists
                    await member.roles.add(secondWarn);
                    addedRoles.push(`<@&${secondWarn}>`);
                } else {
                    return;
                }
            } else {
                if (userPoints.staffPoint) {
                    userPoints.staffPoint -= amountToTake;
                    await userPoints.save();
                } else if (userPoints.eventPoint) {
                    userPoints.eventPoint -= amountToTake;
                    await userPoints.save();
                } else if (userPoints.staffPoint && userPoints.eventPoint) {
                    userPoints.staffPoint -= amountToTake;
                    userPoints.eventPoint -= amountToTake;
                    await userPoints.save();
                }
            }

            interaction.editReply(
                `> :white_check_mark: ${member} has been warned successfully! reason: ${reason}`
            );

            // Attempt to DM the user
            await member
                .send(
                    `> :x: You have been warned in **${interaction.guild.name}** by ${interaction.user} for \`${reason}\``
                )
                .catch((err) => {
                    console.error(
                        `Failed to send DM to ${member.user.tag}: ${err}`
                    );
                });

            // Send embed to log channel
            if (warn_channel) {
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Staff Warned",
                        iconURL: `${client.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setThumbnail(
                        member.user.displayAvatarURL({ dynamic: true })
                    )
                    .addFields(
                        { name: "Member", value: `${member}`, inline: true },
                        {
                            name: "Admin",
                            value: `${interaction.user}`,
                            inline: true,
                        },
                        {
                            name: "Reason",
                            value: `\`${reason}\``,
                            inline: false,
                        },
                        {
                            name: "Points Deducted",
                            value:
                                userPoints.staffPoint ||
                                userPoints.eventPoint ||
                                (userPoints.staffPoint &&
                                    +", " + userPoints.eventPoint >=
                                        amountToTake)
                                    ? `\`${amountToTake}\``
                                    : `0 (Insufficient points)`,
                            inline: true,
                        },
                        {
                            name: "Added Roles",
                            value:
                                addedRoles.length > 0
                                    ? addedRoles.join(", ")
                                    : "None",
                            inline: true,
                        },
                        {
                            name: "When",
                            value: `<t:${Math.floor(Date.now() / 1000)}:R>`,
                            inline: true,
                        }
                    )
                    .setColor("Red")
                    .setTimestamp();
                try {
                    await warn_channel.send({ embeds: [embed] });
                } catch (err) {
                    console.error(
                        `Failed to send embed to log channel: ${err}`
                    );
                }
            }
        } catch (err) {
            console.error(`Error executing warn command: ${err}`);
            interaction.editReply(
                "> :x: An error occurred while executing the warn command."
            );
        }
    },
};
