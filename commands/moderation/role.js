const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "role",
    category: "moderation",
    slashCmdData: {
        name: "role",
        description: "Add/Remove roles from members",
        options: [
            {
                name: "add",
                description: "Add a role to members",
                type: 1,
                options: [
                    {
                        name: "role",
                        description: "Select the role to add",
                        type: 8,
                        required: true,
                    },
                    {
                        name: "member",
                        description: "Select a member to add a role to",
                        type: 6, // User type
                        required: false,
                    },
                    {
                        name: "all",
                        description: "Add role to all members",
                        type: 5, // Boolean type
                        required: false,
                    },
                    {
                        name: "target_role",
                        description: "Select the role to target members with",
                        type: 8,
                        required: false,
                    },
                ],
            },
            {
                name: "remove",
                description: "Remove a role from members",
                type: 1,
                options: [
                    {
                        name: "role",
                        description: "Select the role to remove",
                        type: 8,
                        required: true,
                    },
                    {
                        name: "member",
                        description: "Select a member to remove a role from",
                        type: 6, // User type
                        required: false,
                    },
                    {
                        name: "all",
                        description: "Remove role from all members",
                        type: 5, // Boolean type
                        required: false,
                    },
                    {
                        name: "target_role",
                        description: "Select the role to target members with",
                        type: 8,
                        required: false,
                    },
                ],
            },
        ],
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.ManageRoles],
    botPerms: [PermissionsBitField.Flags.ManageRoles],
    cooldown: "15s",
    async execute(client, interaction) {
        const role = interaction.options.getRole("role");
        const group = interaction.options.getSubcommand();
        const target = interaction.options.getMember("member");
        const addToAll = interaction.options.getBoolean("all");
        const targetRole = interaction.options.getRole("target_role");

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.ManageRoles
            )
        ) {
            return interaction.editReply(
                "> :x: You don't have permission to use this command!"
            );
        }

        const botMember = interaction.guild.members.me;
        if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return interaction.editReply(
                "> :x: I don't have permission to manage roles! Please check my permissions."
            );
        }

        // Check for required choices and mutual exclusivity
        const choicesCount = [target, addToAll, targetRole].filter(
            Boolean
        ).length;
        if (choicesCount !== 1) {
            return interaction.editReply(
                "> :x: You must choose exactly one option: a specific member, 'all', or a target role!"
            );
        }

        if (target) {
            // Handle specific member
            if (group === "add") {
                if (
                    interaction.user.id !== interaction.guild.ownerId &&
                    role.comparePositionTo(target.roles.highest) > 0
                ) {
                    return interaction.editReply(
                        `> You must have the \`@${role.name}\` role or higher to perform this action!`
                    );
                }

                if (target.roles.cache.has(role.id)) {
                    return await interaction.editReply({
                        content: `> ${target.user} already has \`@${role.name}\`!`,
                    });
                }

                await target.roles
                    .add(role)
                    .then(async () => {
                        await interaction.editReply({
                            content: `> Successfully added \`@${role.name}\` to ${target.user}!`,
                        });
                    })
                    .catch(async (err) => {
                        return await interaction.editReply({
                            content: `> I can't add \`@${role.name}\` to ${target.user}!`,
                        });
                    });
            } else if (group === "remove") {
                if (
                    interaction.user.id !== interaction.guild.ownerId &&
                    role.comparePositionTo(interaction.member.roles.highest) >=
                        0
                ) {
                    return interaction.editReply(
                        `> You must have a higher role than \`@${role.name}\` to perform this action!`
                    );
                }

                if (!target.roles.cache.has(role.id)) {
                    return await interaction.editReply({
                        content: `> ${target.user} doesn't have \`@${role.name}\`!`,
                    });
                }

                await target.roles
                    .remove(role)
                    .then(async () => {
                        await interaction.editReply({
                            content: `> Successfully removed \`@${role.name}\` from ${target.user}`,
                        });
                    })
                    .catch(async (err) => {
                        return await interaction.editReply({
                            content: `> I can't remove \`@${role.name}\` from ${target.user}!`,
                        });
                    });
            }
        } else if (addToAll) {
            // Handle adding/removing role from all members
            const members = await interaction.guild.members.fetch();

            if (group === "add") {
                for (const member of members.values()) {
                    if (!member.roles.cache.has(role.id)) {
                        await member.roles
                            .add(role)
                            .catch((err) => console.error(err));
                    }
                }
                return await interaction.editReply({
                    content: `> Successfully added \`@${role.name}\` to all members!`,
                });
            } else if (group === "remove") {
                for (const member of members.values()) {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles
                            .remove(role)
                            .catch((err) => console.error(err));
                    }
                }
                return await interaction.editReply({
                    content: `> Successfully removed \`@${role.name}\` from all members!`,
                });
            }
        } else if (targetRole) {
            // Handle adding/removing role based on target role
            const members = await interaction.guild.members.fetch();
            const membersWithTargetRole = members.filter((member) =>
                member.roles.cache.has(targetRole.id)
            );

            if (group === "add") {
                for (const member of membersWithTargetRole.values()) {
                    if (!member.roles.cache.has(role.id)) {
                        await member.roles
                            .add(role)
                            .catch((err) => console.error(err));
                    }
                }
                return await interaction.editReply({
                    content: `> Successfully added \`@${role.name}\` to all members with \`@${targetRole.name}\`!`,
                });
            } else if (group === "remove") {
                for (const member of membersWithTargetRole.values()) {
                    if (member.roles.cache.has(role.id)) {
                        await member.roles
                            .remove(role)
                            .catch((err) => console.error(err));
                    }
                }
                return await interaction.editReply({
                    content: `> Successfully removed \`@${role.name}\` from all members with \`@${targetRole.name}\`!`,
                });
            }
        }
    },
};
