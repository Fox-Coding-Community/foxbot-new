const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const Vacation = require('./../../models/Vacation');
const LogChannel = require('../../models/LogChannel');

const vacationRoleId = '1137097373559038045';

// Helper function to chunk the roles
function chunkRoles(roleIds, guild) {
    const roles = roleIds.map(roleId => guild.roles.cache.get(roleId));
    return roles.filter(role => role).map(role => `<@&${role.id}>`).join(', ');
}

module.exports = {
    name: "vacation",
    category: "moderation",
    slashCmdData: {
        name: "vacation",
        description: "Manage vacation status for users.",
        options: [
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
    usrPerms: [PermissionsBitField.Flags.Administrator],
    botPerms: [PermissionsBitField.Flags.ManageRoles],
    cooldown: "15s",
  async execute(client, interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.editReply("> :x: You don't have permission to use this command!");
    }
        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser("user");
    
        if (subcommand === 'remove') {
            const guildMember = interaction.guild.members.cache.get(user.id);
            if (!guildMember) {
                return interaction.editReply(`> :x: ${guildMember} is not a member of this guild!`);
            }
            if (!guildMember.roles.cache.has(client.staffRole)) {
                return interaction.editReply(`> :x: ${guildMember} is not a staff member!`);
            }
            return await this.removeVacation(client, interaction);
        }
    },

    async removeVacation(client, interaction) {
        const user = interaction.options.getUser("user");
        const executor = interaction.user;
        const targetMember = await interaction.guild.members.fetch(user.id).catch(console.error);

        if (!targetMember) {
            return interaction.editReply("> :x: Unable to fetch the specified user.");
        }

        const vacationData = await Vacation.findOne({ userId: user.id });
        if (!vacationData) {
            return interaction.editReply("> :x: This user is not currently on vacation!");
        }

        const roleMentions = chunkRoles(vacationData.roles, interaction.guild);

        // Restore the roles and remove the vacation role
        await targetMember.roles.add(vacationData.roles);
        await targetMember.roles.remove(vacationRoleId);

        await Vacation.deleteOne({ userId: user.id });

        const logChannel = await LogChannel.findOne({ guildId: interaction.guild.id });
        const vacation_channel = logChannel ? interaction.guild.channels.cache.get(logChannel.vacation_channelId) : null;

        const embed = new EmbedBuilder()
        .setAuthor({ name: "Vacation Ended", iconURL: `${client.user.displayAvatarURL({ dynamic: true })}` })
        .setColor(client.color)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 1024 }))
        .addFields(
            { name: "User", value: `${user}`, inline: true },
          { name: "Admin", value: `${interaction.user}`, inline: true },
            { name: "Roles Restored", value: roleMentions, inline: false },
        )
        .setFooter({ text: `Vacation period ended`, iconURL: `${client.user.displayAvatarURL({ dynamic: true })}` })
        .setTimestamp();

        if (vacation_channel) {
            vacation_channel.send({ embeds: [embed] });
        }

        
        interaction.editReply(`> ✅ ${user} is no longer on vacation!`);
    },
};
