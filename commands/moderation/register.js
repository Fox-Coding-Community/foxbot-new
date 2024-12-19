const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const mongoose = require("mongoose");
const UserMessageCount = require("../../models/UserMessageCount");
const config = require("./../../config.js");

module.exports = {
    name: "register",
    category: "moderation",
    slashCmdData: {
        name: "register",
        description: "Register a staff or event member in the database",
        options: [
            {
                name: "member",
                description: "The member you want to register",
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

        // Check if the user has permission to use this command
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
                "> :x: You can't register a bot as a staff member!"
            );
        }

        if (!guildMember) {
            return interaction.editReply(
                `> :x: ${user.username} Is not a member of this guild!`
            );
        }

        // Check if the user has the staff role
        if (
            !guildMember.roles.cache.has(client.staffRole || client.eventRole)
        ) {
            return interaction.editReply(
                `> :x: ${user.username} does not have the staff or event role!`
            );
        }

        // Function to check if the user is already registered
        async function getUserMessageCount(userId) {
            try {
                const userData = await UserMessageCount.findOne({ userId });

                if (userData) {
                    return interaction.editReply(
                        `> :x:${user.username} is already a registered staff member!`
                    );
                } else {
                    // If not registered, create a new entry
                    await registerUser(userId);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                await interaction.editReply(
                    "> :x: There was an error fetching user data. Please try again."
                );
            }
        }

        async function registerUser(userId) {
            try {
                if (guildMember.roles.cache.has(client.staffRole)) {
                    const newUser = new UserMessageCount({
                        userId: userId,
                        staffRole: true,
                        staffMessage: 0,
                        staffPoint: 0,
                        lastUpdated: Date.now(),
                    });

                    await newUser.save();
                    await interaction.editReply(
                        `> :white_check_mark: Successfully registered ${guildMember} as a staff member!`
                    );
                } else if (guildMember.roles.cache.has(client.eventRole)) {
                    const newUser = new UserMessageCount({
                        userId: userId,
                        eventRole: true,
                        eventMessage: 0,
                        eventPoint: 0,
                        lastUpdated: Date.now(),
                    });

                    await newUser.save();
                    await interaction.editReply(
                        `> :white_check_mark: Successfully registered ${guildMember} as a event member!`
                    );
                } else if (
                    guildMember.roles.cache.has(client.staffRole) &&
                    guildMember.roles.cache.has(client.eventRole)
                ) {
                    const newUser = new UserMessageCount({
                        userId: userId,
                        staffRole: true,
                        eventRole: true,
                        staffMessage: 0,
                        eventMessage: 0,
                        staffPoint: 0,
                        eventPoint: 0,
                        lastUpdated: Date.now(),
                    });
                    await newUser.save();
                    await interaction.editReply(
                        `> :white_check_mark: Successfully registered ${guildMember} as a event & staff member!`
                    );
                }
            } catch (error) {
                console.error("Error registering user:", error);
                await interaction.editReply(
                    "> :x: There was an error registering the user. Please try again."
                );
            }
        }

        await getUserMessageCount(user.id);
    },
};
