const {
    EmbedBuilder,
    ButtonBuilder,
    ActionRowBuilder,
    PermissionsBitField,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} = require("discord.js");
const UserMessageCount = require("../../models/UserMessageCount");

module.exports = {
    name: "info",
    category: "moderation",
    slashCmdData: {
        name: "info",
        description: "Display a staff info",
        options: [
            {
                name: "member",
                description: "The member to check their info",
                type: 6,
                required: false,
            },
        ],
    },
    devOnly: false,
    usrPerms: [],
    botPerms: [],
    cooldown: "5s",
    async execute(client, interaction) {
        const user = interaction.options.getUser("member") || interaction.user;
        const guildMember = interaction.guild.members.cache.get(user.id);

        if (!guildMember) {
            return interaction.editReply(
                `> :x: ${user} is not a member of this guild!`
            );
        }

        if (
            !guildMember.roles.cache.has(client.staffRole || client.eventRole)
        ) {
            return interaction.editReply(
                `> :x: ${user} is not a staff or event member!`
            );
        }

        async function getUserMessageCount(userId) {
            try {
                const userData = await UserMessageCount.findOne({ userId });
                if (!userData) {
                    console.log(`No data found for user ${userId}.`);
                    return interaction.editReply(
                        `> :x: No data found for ${user}\! Please make sure they are a registered staff or event member.`
                    );
                }

                const isEventRole =
                    userData.eventRole === true && userData.staffRole === false;
                const isStaffRole =
                    userData.staffRole === true && userData.eventRole === false;
                const pointsType = isEventRole
                    ? "eventPoint"
                    : isStaffRole
                    ? "staffPoint"
                    : null;
                const messageType = isEventRole
                    ? "eventMessage"
                    : isStaffRole
                    ? "staffMessage"
                    : null;

                const lastUpdatedTimestamp = Math.floor(
                    userData.lastUpdated / 1000
                );

                let embed = new EmbedBuilder()
                    .setAuthor({
                        name: `${user.username} Info`,
                        iconURL: user.displayAvatarURL({ dynamic: true }),
                    })
                    .setColor(client.color)
                    .setThumbnail(
                        user.displayAvatarURL({ dynamic: true, size: 1024 })
                    )
                    .setFooter({
                        text: `Requested by ${interaction.user.username}`,
                        iconURL: interaction.guild.iconURL({
                            dynamic: true,
                            format: "png",
                            size: 1024,
                        }),
                    })
                    .addFields(
                        { name: "> User ID", value: `**${userData.userId}**` },
                        {
                            name: "> Points",
                            value: `**${userData[pointsType].toFixed(4)}**`,
                        }, // Ensure four decimal places
                        {
                            name: "> Messages",
                            value: `**${userData[messageType]}**`,
                        },
                        {
                            name: "> Last Updated",
                            value: `<t:${lastUpdatedTimestamp}:F> (<t:${lastUpdatedTimestamp}:R>)`,
                        }
                    );

                const actionRow = new ActionRowBuilder();

                if (
                    interaction.member.permissions.has(
                        PermissionsBitField.Flags.Administrator
                    )
                ) {
                    const modifyButton = new ButtonBuilder()
                        .setCustomId("modify_points")
                        .setLabel("Modify Points")
                        .setStyle("Primary");

                    const resetButton = new ButtonBuilder()
                        .setCustomId("reset_data")
                        .setLabel("Reset Data")
                        .setStyle("Danger");

                    actionRow.addComponents(modifyButton, resetButton);
                }

                await interaction.editReply({
                    embeds: [embed],
                    components: actionRow.components.length ? [actionRow] : [],
                });

                const filter = (i) =>
                    (i.customId === "modify_points" ||
                        i.customId === "reset_data") &&
                    i.user.id === interaction.user.id;
                const collector =
                    interaction.channel.createMessageComponentCollector({
                        filter,
                    });

                collector.on("collect", async (i) => {
                    if (i.customId === "modify_points") {
                        await showPointModificationModal(i, userData.userId);
                    } else if (i.customId === "reset_data") {
                        await resetUserData(i, userData);
                    }
                    collector.stop();
                });
            } catch (error) {
                console.error("Error fetching user data:", error);
                await interaction.editReply(
                    "> :x: There was an error fetching user data. Please try again!"
                );
            }
        }

        await getUserMessageCount(user.id);
    },
};

async function showPointModificationModal(interaction, userId) {
    const modal = new ModalBuilder()
        .setCustomId(`modify_points_modal_${userId}`)
        .setTitle("Modify Points");

    const operationInput = new TextInputBuilder()
        .setCustomId("operation")
        .setLabel("Operation (Add, Sub, Set)")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const amountInput = new TextInputBuilder()
        .setCustomId("amount")
        .setLabel("Amount of Points")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const row1 = new ActionRowBuilder().addComponents(operationInput);
    const row2 = new ActionRowBuilder().addComponents(amountInput);

    modal.addComponents(row1, row2);
    await interaction.showModal(modal);
}

module.exports.onModalSubmit = async (client, modalInteraction) => {
    if (modalInteraction.customId.startsWith("modify_points_modal_")) {
        const userId = modalInteraction.customId.split("_")[3];
        const operation =
            modalInteraction.fields.getTextInputValue("operation");
        const amount = parseFloat(
            modalInteraction.fields.getTextInputValue("amount")
        ); // Use parseFloat for decimals

        const replyError = (message) =>
            modalInteraction.reply({
                content: `> :x: ${message}`,
                ephemeral: true,
            });

        const userData = await UserMessageCount.findOne({ userId });

        if (!userData) return replyError("User data not found!");

        if (amount < 0)
            return replyError("Invalid amount! Please use a positive number.");

        if (!["add", "sub", "set"].includes(operation)) {
            return replyError(
                "Invalid operation! Please use Add, Sub, or Set."
            );
        }

        const isEventRole =
            userData.eventRole === true && userData.staffRole === false;
        const isStaffRole =
            userData.staffRole === true && userData.eventRole === false;
        const pointsType = isEventRole
            ? "eventPoint"
            : isStaffRole
            ? "staffPoint"
            : null;

        if (!pointsType)
            return replyError("Invalid role configuration for this user.");

        switch (operation) {
            case "add":
                userData[pointsType] += amount;
                break;
            case "sub":
                userData[pointsType] = Math.max(
                    0,
                    userData[pointsType] - amount
                ); // Ensure points do not go below 0
                break;
            case "set":
                userData[pointsType] = amount;
                break;
        }

        await userData.save();
        await modalInteraction.reply({
            content: `> :white_check_mark: Successfully modified points! New points: ${userData[
                pointsType
            ].toFixed(4)}`,
            ephemeral: true,
        });
    }
};

async function resetUserData(interaction, userData) {
    const isEventRole =
        userData.eventRole === true && userData.staffRole === false;
    const isStaffRole =
        userData.staffRole === true && userData.eventRole === false;
    const pointsType = isEventRole
        ? "eventPoint"
        : isStaffRole
        ? "staffPoint"
        : null;
    const messageType = isEventRole
        ? "eventMessage"
        : isStaffRole
        ? "staffMessage"
        : null;

    userData[pointsType] = 0;
    userData[messageType] = 0;
    await userData.save();
    await interaction.reply({
        content: `> :white_check_mark: Successfully reset data!`,
        ephemeral: true,
    });
}
