const {
    Client,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
} = require("discord.js");

const Vacation = require("../models/Vacation");
const LogChannel = require("../models/LogChannel");

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
    const durationDays = interaction.fields.getTextInputValue("duration");
    const reason = interaction.fields.getTextInputValue("reason");
    const user = interaction.user;
    const executor = interaction.member;

    // Check permissions if user is not the executor
    if (user.id !== interaction.user.id) {
        if (
            !executor.roles.cache.has(client.staffRole) ||
            !executor.permissions.has(PermissionsBitField.Flags.Administrator)
        ) {
            return interaction.editReply(
                "> :x: You do not have permission to put others on vacation."
            );
        }

        const targetMember = await interaction.guild.members.fetch(user.id);
        if (!targetMember || !targetMember.roles.cache.has(client.staffRole)) {
            return interaction.editReply(
                "> :x: The target user does not have the staff role and cannot be put on vacation."
            );
        }
    }

    // Check if the user is already on vacation
    const existingVacation = await Vacation.findOne({ userId: user.id });
    if (existingVacation) {
        return interaction.editReply("> :x: This user is already on vacation!");
    }

    // Validate vacation duration
    if (durationDays < 2 || durationDays > 30) {
        return interaction.editReply(
            "> :x: The vacation duration must be between 2 and 30 days!"
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
        `> ✅ You have been put on vacation for \`${durationDays}\` days! Reason: \`${reason}\``
    );
}

module.exports = {
    event: "interactionCreate",
    /**
     *
     * @param {Client} client
     * @param {ChatInputCommandInteraction} interaction
     * @returns
     */
    run: async (client, interaction) => {
        try {
            if (interaction.isButton()) {
                if (interaction.customId === "vacset_apply") {
                    let modal = new ModalBuilder()
                        .setCustomId("vacset_apply_modal")
                        .setTitle("Set Vacation");

                    let duration = new TextInputBuilder()
                        .setCustomId("duration")
                        .setLabel("Duration")
                        .setPlaceholder("2 to 30 Days")
                        .setMinLength(1)
                        .setMaxLength(2)
                        .setRequired(true)
                        .setStyle(TextInputStyle.Short);

                    let reason = new TextInputBuilder()
                        .setCustomId("reason")
                        .setLabel("Reason")
                        .setPlaceholder("Reason")
                        .setRequired(true)
                        .setStyle(TextInputStyle.Paragraph);

                    let row1 = new ActionRowBuilder().addComponents(duration);
                    let row2 = new ActionRowBuilder().addComponents(reason);

                    modal.addComponents(row1, row2);

                    await interaction.showModal(modal);
                }
            } else if (interaction.isModalSubmit()) {
                if (interaction.customId === "vacset_apply_modal") {
                    await interaction.deferReply({ ephemeral: true });

                    const duration =
                        interaction.fields.getTextInputValue("duration");

                    if (isNaN(duration))
                        return interaction.editReply({
                            content: `> :x: Duration must be numbers`,
                            ephemeral: true,
                        });

                    if (duration <= 1)
                        return interaction.editReply({
                            content: `> :x: Duration must be 2 days or more!`,
                            ephemeral: true,
                        });

                    if (duration > 30)
                        return interaction.editReply({
                            content:
                                "> :x: You can only set vacation for 30 days!",
                            ephemeral: true,
                        });

                    const reason =
                        interaction.fields.getTextInputValue("reason");

                    return await setVacation(client, interaction);
                }
            }
        } catch (error) {
            console.error(
                "Error handling guildMemberUpdate for role changes:",
                error
            );
        }
    },

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
                    const member = await guild.members.fetch(userId);

                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setAuthor({
                            name: "Vacation Ended",
                            iconURL: `${client.user.displayAvatarURL({
                                dynamic: true,
                            })}`,
                        })
                        .addFields(
                            {
                                name: "Member",
                                value: `<@${vacation.userId}>`,
                                inline: true,
                            },
                            {
                                name: "Reason",
                                value: `Vacation Ended`,
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
