const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const Vacation = require("./../../models/Vacation");
const LogChannel = require("../../models/LogChannel");

const vacationRoleId = "1137097373559038045";
const rolesToRemove = [
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
    "1380170344211550238",
];

// Helper function to chunk the roles
function chunkRoles(roleIds, guild) {
    const roles = roleIds.map((roleId) => guild.roles.cache.get(roleId));
    return roles
        .filter((role) => role)
        .map((role) => `<@&${role.id}>`)
        .join(", ");
}

// Helper function to set a user on vacation
async function setVacation(client, interaction) {
    const durationDays = interaction.options.getInteger("duration");
    const reason = interaction.options.getString("reason");
    const user = interaction.options.getUser("user");
    const executor = interaction.member;

    // Check if the user is already on vacation
    const existingVacation = await Vacation.findOne({ userId: user.id });
    if (existingVacation) {
        return interaction.editReply("> :x: This user is already on vacation!");
    }

    // Validate vacation duration
    if (durationDays < 30 || durationDays > 365) {
        return interaction.editReply(
            "> :x: The vacation duration must be between 30 and 365 days!"
        );
    }

    const vacationEndDate = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const targetMember = await interaction.guild.members.fetch(user.id);
    const rolesToRemoveUser = targetMember.roles.cache
        .filter((role) => rolesToRemove.includes(role.id))
        .map((role) => role.id);

    // Assign vacation role and remove specified roles
    await targetMember.roles.add(vacationRoleId);
    await targetMember.roles.remove(rolesToRemoveUser);

    // Save vacation data to the database
    await Vacation.create({
        userId: user.id,
        guildId: interaction.guild.id,
        roles: rolesToRemoveUser,
        endTime: vacationEndDate,
        reason,
    });

    // Prepare the vacation log embed
    const logChannel = await LogChannel.findOne({
        guildId: interaction.guild.id,
    });
    const vacation_channel = logChannel
        ? interaction.guild.channels.cache.get(logChannel.vacation_channelId)
        : null;

    const roleMentions = chunkRoles(rolesToRemoveUser, interaction.guild);

    const embed = new EmbedBuilder()
        .setAuthor({
            name: "Vacation",
            iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
        })
        .setColor(client.color)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
        .addFields(
            { name: "User", value: `${user}`, inline: true },
            { name: "Duration", value: `${durationDays} days`, inline: true },
            { name: "Reason", value: `${reason}`, inline: true },
            {
                name: "Admin",
                value: `${interaction.user || "None"}`,
                inline: true,
            },
            { name: "Removed Roles", value: roleMentions, inline: false }
        )
        .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
        })
        .setTimestamp();

    // Send the embed to the log channel
    if (vacation_channel) {
        vacation_channel.send({ embeds: [embed] });
    }

    // Confirm the vacation was set
    interaction.editReply(
        `> ✅ ${user} has been put on vacation for \`${durationDays}\` days! Reason: \`${reason}\``
    );
}

module.exports = {
    name: "vacation",
    category: "moderation",
    slashCmdData: {
        name: "vacation",
        description: "Manage vacation status for users.",
        options: [
            {
                name: "set",
                description: "Put a user on vacation for a specified duration.",
                type: 1,
                options: [
                    {
                        name: "user",
                        description: "The user to put on vacation",
                        type: 6,
                        required: true,
                    },
                    {
                        name: "duration",
                        description:
                            "Specify the duration of the vacation (30 to 356 days) for admins only",
                        type: 4,
                        required: true,
                    },
                    {
                        name: "reason",
                        description: "Provide a reason for the vacation",
                        type: 3,
                        required: true,
                    },
                ],
            },
            {
                name: "remove",
                description: "Remove a user's vacation status.",
                type: 1,
                options: [
                    {
                        name: "user",
                        description: "The user to remove vacation status from",
                        type: 6,
                        required: true,
                    },
                ],
            },
        ],
    },
    devOnly: false,
    cooldown: "5s",
    async execute(client, interaction) {
        const user = interaction.options.getUser("user");

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return interaction.editReply(
                "> :x: You do not have permission manage vacations for others!"
            );
        }

        if (user.id === interaction.user.id) {
            return interaction.editReply(
                `:x: You can't manage your own vacation!`
            );
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "set") {
            const guildMember = interaction.guild.members.cache.get(user.id);
            if (!guildMember) {
                return interaction.editReply(
                    `> :x: ${guildMember} is not a member of this guild!`
                );
            }
            if (!guildMember.roles.cache.has(client.staffRole)) {
                return interaction.editReply(
                    `> :x: ${guildMember} is not a staff member!`
                );
            }
            return await setVacation(client, interaction);
        } else if (subcommand === "remove") {
            const guildMember = interaction.guild.members.cache.get(user.id);

            if (!guildMember) {
                return interaction.editReply(
                    `> :x: ${guildMember} is not a member of this guild!`
                );
            }
            if (!guildMember.roles.cache.has(client.staffRole)) {
                return interaction.editReply(
                    `> :x: ${guildMember} is not a staff member!`
                );
            }
            return await this.removeVacation(client, interaction);
        }
    },

    async removeVacation(client, interaction) {
        const user = interaction.options.getUser("user");
        const executor = interaction.member;
        const targetMember = await interaction.guild.members
            .fetch(user.id)
            .catch(console.error);

        if (!targetMember) {
            return interaction.editReply(
                "> :x: Unable to fetch the specified user."
            );
        }

        const vacationData = await Vacation.findOne({ userId: user.id });
        if (!vacationData) {
            return interaction.editReply(
                "> :x: This user is not currently on vacation!"
            );
        }

        const roleMentions = chunkRoles(vacationData.roles, interaction.guild);

        // Restore the roles and remove the vacation role
        await targetMember.roles.add(vacationData.roles);
        await targetMember.roles.remove(vacationRoleId);

        // Delete the vacation record
        await Vacation.deleteOne({ userId: user.id });

        // Prepare the vacation log embed
        const logChannel = await LogChannel.findOne({
            guildId: interaction.guild.id,
        });
        const vacation_channel = logChannel
            ? interaction.guild.channels.cache.get(
                  logChannel.vacation_channelId
              )
            : null;

        const embed = new EmbedBuilder()
            .setAuthor({
                name: "Vacation Ended",
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
            })
            .setColor(client.color)
            .setThumbnail(
                interaction.guild.iconURL({ dynamic: true, size: 1024 })
            )
            .addFields(
                { name: "User", value: `${user}`, inline: true },
                { name: "Admin", value: `${interaction.user}`, inline: true },
                { name: "Roles Restored", value: roleMentions, inline: false }
            )
            .setFooter({
                text: `Vacation period ended`,
                iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`,
            })
            .setTimestamp();

        // Send the embed to the log channel
        if (vacation_channel) {
            vacation_channel.send({ embeds: [embed] });
        }

        // Confirm vacation removal
        interaction.editReply(`> ✅ ${user} is no longer on vacation.`);
    },

    // Function to load and check if any vacations have expired
    loadVacations: async function (client) {
        const vacations = await Vacation.find();
        const now = Date.now();

        const guild = client.guilds.cache.first();

        const logChannel = await LogChannel.findOne({});
        const vacation_channel = logChannel
            ? guild.channels.cache.get(logChannel.vacation_channelId)
            : null;

        vacations.forEach(async (vacation) => {
            if (vacation.endTime <= now) {
                async function getMember(client, guildId, userId) {
                    try {
                        const guild =
                            client.guilds.cache.get(guildId) ||
                            (await client.guilds.fetch(guildId));
                        if (!guild) throw new Error("Guild not found!");

                        const member = await guild.members.fetch(userId);
                        return member;
                    } catch (error) {
                        console.error("Error fetching member:", error);
                        return null;
                    }
                }

                const targetMember = await getMember(
                    client,
                    "300481238773399553",
                    vacation.userId
                );

                if (targetMember) {
                    await targetMember.roles.add(vacation.roles);
                    await targetMember.roles.remove(vacationRoleId);
                }
                await Vacation.deleteOne({ userId: vacation.userId });
                if (vacation_channel) {
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setAuthor({
                            name: "Vacation Removed",
                            iconURL: `${client.user.displayAvatarURL({
                                dynamic: true,
                            })}`,
                        })
                        .addFields(
                            {
                                name: "Member",
                                value: `<@${mute.userId}>`,
                                inline: true,
                            },
                            { name: "Admin", value: `None`, inline: true },
                            {
                                name: "Reason",
                                value: `Vacation duration expired`,
                                inline: true,
                            }
                        )
                        .setTimestamp()
                        .setThumbnail(
                            member.user.displayAvatarURL({
                                dynamic: true,
                                size: 1024,
                            })
                        );

                    vacation_channel.send({ embeds: [embed] });
                }
            }
        });
    },

    setVacation,
};
