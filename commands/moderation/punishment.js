const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const Punishments = require("../../models/Punishments");
const LogChannel = require("../../models/LogChannel");

const guildId = "300481238773399553";
const punishmentRoleId = "1070078397453189161"; // Punishment role to add
const roleToAddFirst = "1080918072065527828"; // First role to add
const roleToAddSecond = "1068466065719447562"; // Second role to add
const rolesToRemove = [
    "1165209477302198282",
    "1270778782822957057",
    "855055867775025152",
    "1169640736262717471",
    "1270779316246155316",
    "327989761677590530",
    "1169002700281757751",
    "1270779676729806919",
    "1068501587846246450",
    "1169639127789092895",
    "1270780308341657660",
    "378659419652751363",
    "1169283299013820526",
    "451665764936712192",
    "1197467231962025984",
    "460539606971187200",
    "1213597128841232950",
    "1183154616465104997",
    "1063072755802714112",
    "1213113479599493120",
    "1119120674087239732",
    "1262705542972047370",
    "1270779316246155316",
    "1213597128841232395",
];

async function schedulePunishmentRemoval(client, member, punishment) {
    const removalDelay = punishment.endTime - Date.now();

    if (removalDelay > 0) {
        setTimeout(async () => {
            try {
                // Remove the punishment role
                await member.roles.remove(punishmentRoleId);

                // Restore all removed roles
                const rolesToRestoreMembers = punishment.removedRoles
                    .map((roleId) => member.guild.roles.cache.get(roleId))
                    .filter((role) => role);
                for (const role of rolesToRestoreMembers) {
                    await member.roles.add(role);
                }

                // Delete the punishment record from the database
                await Punishments.deleteOne({ userId: member.user.id });
            } catch (error) {
                console.error("Error removing punishment:", error);
            }
        }, removalDelay);
    } else {
        console.error("Removal delay is negative. This should not happen.");
    }
}

const getLogChannelId = async (guildId) => {
    const logChannelRecord = await LogChannel.findOne({ guildId });
    return logChannelRecord ? logChannelRecord.punishment_channelId : null;
};

const loadPunishments = async (client) => {
    const punishments = await Punishments.find();
    for (const punishment of punishments) {
        const member = await client.guilds.cache
            .get(guildId)
            .members.fetch(punishment.userId)
            .catch(console.error);

        if (member) {
            const currentTime = Date.now();
            if (currentTime > punishment.endTime) {
                await member.roles
                    .remove(punishmentRoleId)
                    .catch(console.error);

                // Restore all removed roles
                const rolesToRestoreMembers = punishment.removedRoles
                    .map((roleId) => member.guild.roles.cache.get(roleId))
                    .filter((role) => role);
                for (const role of rolesToRestoreMembers) {
                    await member.roles.add(role).catch(console.error);
                }

                // Delete the punishment record from the database
                await Punishments.deleteOne({ userId: member.user.id });

                const logChannelId = await getLogChannelId(
                    "300481238773399553"
                );
                const logChannel = logChannelId
                    ? await client.channels.fetch(logChannelId)
                    : null;

                const removeEmbed = new EmbedBuilder()
                    .setAuthor({
                        name: "Punishment Ended",
                        iconURL: `${client.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setThumbnail(
                        member.user.displayAvatarURL({ dynamic: true })
                    )
                    .addFields(
                        {
                            name: "Member",
                            value: `<@${member.user.id}>`,
                            inline: true,
                        },
                        { name: "Admin", value: `None`, inline: false },
                        {
                            name: "Restored Roles",
                            value:
                                rolesToRestoreMembers
                                    .map((role) => `<@&${role.id}>`)
                                    .join(", ") || "None",
                            inline: true,
                        },
                        {
                            name: "Reason",
                            value: `\`Punishment Ended\``,
                            inline: true,
                        }
                    )
                    .setColor("Green")
                    .setTimestamp();

                if (logChannel) {
                    await logChannel.send({ embeds: [removeEmbed] });
                }
            } else {
                // If punishment is still active, add the punishment role
                await member.roles.add(punishmentRoleId).catch(console.error);
            }

            // Schedule punishment removal if it's within the duration
            if (currentTime <= punishment.endTime) {
                schedulePunishmentRemoval(client, member, punishment);
            }
        }
    }
};

module.exports = {
    name: "punishment",
    category: "moderation",
    slashCmdData: {
        name: "punishment",
        description: "Manage staff member punishments",
        options: [
            {
                name: "add",
                type: 1,
                description: "Add a punishment to a staff member",
                options: [
                    {
                        name: "member",
                        type: 6,
                        description: "Select the staff member",
                        required: true,
                    },
                    {
                        name: "duration",
                        type: 4,
                        description: "Duration in days (1-30)",
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
                description: "Remove a punishment from a staff member",
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
            {
                name: "list",
                type: 1,
                description: "View list of active punishments",
            },
        ],
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.Administrator],
    botPerms: [PermissionsBitField.Flags.ManageRoles],
    cooldown: "5s",
    async execute(client, interaction) {
        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return interaction.editReply(
                "> :x: You don't have permission to use this command!"
            );
        }

        const subcommand = interaction.options.getSubcommand();
        const member = interaction.options.getMember("member");

        if (subcommand === "add") {
            const duration = interaction.options.getInteger("duration");
            const reason = interaction.options.getString("reason");

            if (duration < 1 || duration > 30) {
                return interaction.editReply(
                    "> :x: Please provide a valid duration (1-30 days)!"
                );
            }

            // Check if the member is a staff member
            if (
                !member.roles.cache.some(
                    (role) =>
                        role.id === client.staffRole ||
                        Punishments.findOne({ userId: member.user.id })
                )
            ) {
                return interaction.editReply(
                    "> :x: The selected member is not a staff member!"
                );
            }

            // Fetch roles to remove based on predefined roles
            const rolesToRemoveIds = rolesToRemove.map(String);
            const rolesRemoved = member.roles.cache.filter((role) =>
                rolesToRemoveIds.includes(role.id)
            );

            // Check if the user already has a punishment
            const existingPunishment = await Punishments.findOne({
                userId: member.user.id,
            });
            const removedRolesArray = [];

            // If there's an existing punishment, skip roles already recorded
            if (existingPunishment) {
                const existingRemovedRoles = existingPunishment.removedRoles;
                for (const role of rolesRemoved.values()) {
                    if (!existingRemovedRoles.includes(role.id)) {
                        await member.roles.remove(role).catch(console.error);
                        removedRolesArray.push(role.id);
                    }
                }
            } else {
                // Remove all matching roles if there's no existing punishment
                for (const role of rolesRemoved.values()) {
                    await member.roles.remove(role).catch(console.error);
                    removedRolesArray.push(role.id);
                }
            }

            // Add the punishment role
            await member.roles.add(punishmentRoleId).catch(console.error);

            const firstRoleAdded = existingPunishment
                ? existingPunishment.firstRoleAdded
                : false;

            // Manage the roles based on existing data
            if (firstRoleAdded) {
                await member.roles.add(roleToAddSecond).catch(console.error);
                await member.roles.remove(roleToAddFirst).catch(console.error);
            } else {
                await member.roles.add(roleToAddFirst).catch(console.error);
            }

            const punishmentData = {
                userId: member.user.id,
                duration: duration,
                reason: reason,
                adminId: interaction.user.id,
                removedRoles: [
                    ...(existingPunishment?.removedRoles || []),
                    ...removedRolesArray,
                ],
                endTime: Date.now() + duration * 24 * 60 * 60 * 1000,
                firstRoleAdded: !firstRoleAdded,
            };

            await Punishments.updateOne(
                { userId: member.user.id },
                punishmentData,
                { upsert: true }
            );

            // Log punishment details in the punishment channel
            const logChannelId = await getLogChannelId(interaction.guild.id);
            const logChannel = logChannelId
                ? await client.channels.fetch(logChannelId)
                : null;

            const addEmbed = new EmbedBuilder()
                .setAuthor({
                    name: "Punishment Added",
                    iconURL: `${client.user.displayAvatarURL({
                        dynamic: true,
                    })}`,
                })
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: "Member",
                        value: `<@${member.user.id}>`,
                        inline: true,
                    },
                    {
                        name: "Admin",
                        value: `<@${interaction.user.id}>`,
                        inline: true,
                    },
                    {
                        name: "Duration",
                        value: `${duration} days`,
                        inline: true,
                    },
                    {
                        name: "Removed Roles",
                        value:
                            rolesRemoved
                                .map((role) => `<@&${role.id}>`)
                                .join(", ") || "None",
                        inline: false,
                    },
                    { name: "Reason", value: `\`${reason}\``, inline: true }
                )
                .setColor("Red")
                .setTimestamp();

            if (logChannel) {
                await logChannel.send({ embeds: [addEmbed] });
            }

            // Schedule punishment removal if it's within the duration
            schedulePunishmentRemoval(client, member, punishmentData);

            return interaction.editReply(
                `> ✅ Successfully punished <@${member.user.id}> for ${duration} days. Reason: \`${reason}\``
            );
        } else if (subcommand === "remove") {
            const punishmentRecord = await Punishments.findOne({
                userId: member.user.id,
            });
            if (!punishmentRecord) {
                return interaction.editReply(
                    "> :x: This member does not have an active punishment."
                );
            }

            const reason = interaction.options.getString("reason");

            // Remove the punishment role
            await member.roles.remove(punishmentRoleId).catch(console.error);

            // Restore all removed roles
            const rolesToRestoreMembers = punishmentRecord.removedRoles
                .map((roleId) => member.guild.roles.cache.get(roleId))
                .filter((role) => role);
            for (const role of rolesToRestoreMembers) {
                await member.roles.add(role).catch(console.error);
            }

            const logChannelId = await getLogChannelId(interaction.guild.id);
            const logChannel = logChannelId
                ? await client.channels.fetch(logChannelId)
                : null;

            const removeEmbed = new EmbedBuilder()
                .setAuthor({
                    name: "Punishment Removed",
                    iconURL: `${client.user.displayAvatarURL({
                        dynamic: true,
                    })}`,
                })
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: "Member",
                        value: `<@${member.user.id}>`,
                        inline: true,
                    },
                    {
                        name: "Admin",
                        value: `<@${interaction.user.id}>`,
                        inline: false,
                    },
                    {
                        name: "Restored Roles",
                        value:
                            rolesToRestoreMembers
                                .map((role) => `<@&${role.id}>`)
                                .join(", ") || "None",
                        inline: true,
                    },
                    { name: "Reason", value: `\`${reason}\``, inline: true }
                )
                .setColor("Green")
                .setTimestamp();

            if (logChannel) {
                await logChannel.send({ embeds: [removeEmbed] });
            }

            await Punishments.deleteOne({ userId: member.user.id });

            return interaction.editReply(
                `> ✅ Successfully removed punishment from <@${member.user.id}>. Reason: \`${reason}\``
            );
        } else if (subcommand === "list") {
            const punishments = await Punishments.find();
            if (punishments.length === 0) {
                return interaction.editReply(
                    "> :x: There are no active punishments!"
                );
            } else if (punishments.length > 0) {
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Punishments List",
                        iconURL: `${client.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setColor("Red")
                    .setFooter({
                        text: `Requested by ${interaction.user.username}`,
                        iconURL: `${interaction.user.displayAvatarURL({
                            dynamic: true,
                        })}`,
                    })
                    .setThumbnail(
                        interaction.guild.iconURL({ dynamic: true, size: 1024 })
                    )
                    .setTimestamp();

                punishments.forEach((punishment) => {
                    const member = interaction.guild.members.cache.get(
                        punishment.userId
                    );

                    const remainingMillis = punishment.endTime - Date.now();
                    const days = Math.floor(
                        remainingMillis / (24 * 60 * 60 * 1000)
                    );
                    const hours = Math.floor(
                        (remainingMillis % (24 * 60 * 60 * 1000)) /
                            (60 * 60 * 1000)
                    );
                    const minutes = Math.floor(
                        (remainingMillis % (60 * 60 * 1000)) / (60 * 1000)
                    );
                    const seconds = Math.floor(
                        (remainingMillis % (60 * 1000)) / 1000
                    );

                    const remainingTime =
                        remainingMillis > 0
                            ? `${days > 0 ? `${days} days ` : ""}${
                                  hours > 0 ? `${hours} hours ` : ""
                              }${minutes > 0 ? `${minutes} minutes ` : ""}${
                                  seconds > 0 ? `${seconds} seconds` : ""
                              }`
                            : "Expired";

                    embed.addFields({
                        name: `${
                            member ? member.user.username : "Unknown User"
                        }`,
                        value: `**Remaining:** ${remainingTime}\n**Ends:** <t:${Math.floor(
                            punishment.endTime / 1000
                        )}:F>\n **ID:** \`${member.user.id}\` \n Reason: \`${
                            punishment.reason
                        }\``,
                        inline: false,
                    });
                });

                return interaction.editReply({ embeds: [embed] });
            }
        }
    },
    loadPunishments,
};
