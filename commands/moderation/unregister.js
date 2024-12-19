const {
    EmbedBuilder,
    PermissionsBitField,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const mongoose = require("mongoose");
const UserMessageCount = require("../../models/UserMessageCount");
const Punishments = require("../../models/Punishments");
const config = require("./../../config.js");

mongoose.connect(process.env.db);

module.exports = {
    name: "unregister",
    category: "moderation",
    slashCmdData: {
        name: "unregister",
        description: "Unregister a staff member from the database",
        options: [
            {
                name: "member",
                description: "The member you want to unregister",
                type: 6,
                required: true,
            },
        ],
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.Administrator],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        const user = interaction.options.getUser("member");
        const guildMember = interaction.guild.members.cache.get(user.id);

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return interaction.editReply(
                "> :x: You don't have permission to use this command!"
            );
        }

        if (user.bot) {
            return interaction.editReply(
                "> :x: Bots cannot be registered as a staff in the first place!"
            );
        }

        confirmButton = new ButtonBuilder()
            .setCustomId("confirm_unregister")
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Danger);

        const cancelButton = new ButtonBuilder()
            .setCustomId("cancel_unregister")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary);

        const row = { type: 1, components: [confirmButton, cancelButton] };

        await interaction.editReply({
            content: `Are you sure you want to unregister ${user}?`,
            components: [row],
        });

        const filter = (buttonInteraction) => {
            return buttonInteraction.user.id === interaction.user.id;
        };

        const collector = interaction.channel.createMessageComponentCollector({
            filter,
        });

        collector.on("collect", async (buttonInteraction) => {
            if (buttonInteraction.customId === "confirm_unregister") {
                await unregisterUser(user.id, buttonInteraction);
            } else if (buttonInteraction.customId === "cancel_unregister") {
                await buttonInteraction.reply({
                    content: "Unregistration canceled.",
                    ephemeral: true,
                });
            }
            collector.stop();
        });

        collector.on("end", (collected, reason) => {
            if (reason === "time") {
                interaction.followUp({
                    content: "You took too long to respond!",
                    ephemeral: true,
                });
            }
        });

        async function unregisterUser(userId, buttonInteraction) {
            try {
                const punished = await Punishments.findOne({ userId });
                const userData = await UserMessageCount.findOne({ userId });

                if (!userData) {
                    return buttonInteraction.reply(
                        `> :x: User is not even registered as a staff member!`
                    );
                } else {
                    await UserMessageCount.deleteOne({ userId });

                    if (punished) {
                        await Punishments.deleteOne({ userId });
                    }

                    await buttonInteraction.reply(
                        `> :white_check_mark: Successfully unregistered ${user} from the staff!`
                    );
                }
            } catch (error) {
                console.error("Error unregistering user:", error);
                await buttonInteraction.reply(
                    "> :x: There was an error unregistering the user. Please try again."
                );
            }
        }
    },
};
