const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "list",
    category: "moderation",
    slashCmdData: {
        name: "list",
        description: "Display Staff List",
        options: [
            {
                name: "staff",
                description: "Staff list",
                type: 1,
            },
            {
                name: "events",
                description: "Events list",
                type: 1,
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
            try {
                await interaction.guild.members.fetch();

                const staffRoleId = client.staffRole;

                const membersWithRole = interaction.guild.members.cache
                    .filter(member => member.roles.cache.has(staffRoleId))
                    .map(member => {
                        // Sort roles in descending order of position
                        const sortedRoles = member.roles.cache
                            .sort((a, b) => b.position - a.position)
                            .map(role => role);

                        // Check for second highest role
                        const highestRole = sortedRoles[0];
                        const secondHighestRole = sortedRoles[1] || { name: "No additional roles" };

                        return {
                            user: member.user,
                            displayRole: highestRole.id === staffRoleId ? secondHighestRole.name : highestRole.name,
                        };
                    })
                    .sort((a, b) => {
                        // Sort by role position
                        return interaction.guild.roles.cache.find(r => r.name === b.displayRole)?.position -
                               interaction.guild.roles.cache.find(r => r.name === a.displayRole)?.position;
                    });

                const membersList = membersWithRole
                    .map(member => `${member.user} (${member.displayRole})`)
                    .join("\n") || "No staff members found.";

                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Staff List", iconURL: `${client.user.displayAvatarURL({ dynamic: true })}` })
                    .setColor(client.color)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
                    .setDescription(`**${membersList}**`)
                    .setFooter({
                        text: `Requested by ${interaction.user.username} • Sorted by Role Hierarchy`,
                        iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
                    });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error("Error fetching staff list:", error);
                await interaction.editReply("> :x: There was an error fetching the staff list. Please try again later.");
            }
        }

        if (subcommand === "events") {
            try {
                await interaction.guild.members.fetch();

                const eventRoleId = client.eventRole;

                const membersWithRole = interaction.guild.members.cache
                    .filter(member => member.roles.cache.has(eventRoleId))
                    .map(member => {
                        // Sort roles in descending order of position
                        const sortedRoles = member.roles.cache
                            .sort((a, b) => b.position - a.position)
                            .map(role => role);

                        // Check for second highest role
                        const highestRole = sortedRoles[0];
                        const secondHighestRole = sortedRoles[1] || { name: "No additional roles" };

                        return {
                            user: member.user,
                            displayRole: highestRole.id === eventRoleId ? secondHighestRole.name : highestRole.name,
                        };
                    })
                    .sort((a, b) => {
                        // Sort by role position
                        return interaction.guild.roles.cache.find(r => r.name === b.displayRole)?.position -
                               interaction.guild.roles.cache.find(r => r.name === a.displayRole)?.position;
                    });

                const membersList = membersWithRole
                    .map(member => `${member.user} (${member.displayRole})`)
                    .join("\n") || "No event members found.";

                const embed = new EmbedBuilder()
                    .setAuthor({ name: "Events List", iconURL: `${client.user.displayAvatarURL({ dynamic: true })}` })
                    .setColor(client.color)
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
                    .setDescription(`**${membersList}**`)
                    .setFooter({
                        text: `Requested by ${interaction.user.username} • Sorted by Role Hierarchy`,
                        iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
                    });

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error("Error fetching events list:", error);
                await interaction.editReply("> :x: There was an error fetching the events list. Please try again later.");
            }
        }
    },
};
