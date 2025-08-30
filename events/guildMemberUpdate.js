const { AuditLogEvent, EmbedBuilder } = require("discord.js");
const LogChannel = require("../models/LogChannel");

module.exports = {
    event: "guildMemberUpdate",
    run: async (client, oldMember, newMember) => {
        try {
            const muteroleId = "673133697108672532";

            const oldRoles = oldMember.roles.cache;
            const newRoles = newMember.roles.cache;

            const roleAdded =
                !oldRoles.has(muteroleId) && newRoles.has(muteroleId);
            const roleRemoved =
                oldRoles.has(muteroleId) && !newRoles.has(muteroleId);

            // If neither the role is added nor removed, return
            if (!roleAdded && !roleRemoved) return;

            const guild = newMember.guild;

            // Fetch the audit log for role update actions
            const auditLogs = await guild.fetchAuditLogs({
                type: AuditLogEvent.MemberRoleUpdate,
                limit: 1,
            });

            const logEntry = auditLogs.entries.first();

            // If no log entry or the log entry is not for this member, return
            if (!logEntry || logEntry.target.id !== newMember.id) return;

            const { executor, reason, createdTimestamp } = logEntry;

            // Get the log channel from your database
            const logChannelId = await LogChannel.findOne({
                guildId: guild.id,
            });
            const muteChannel = logChannelId
                ? await guild.channels.fetch(logChannelId.mute_channelId)
                : null;

            if (!muteChannel) return;

            // Build the embed
            const embed = new EmbedBuilder()
                .setColor(roleAdded ? 0xed4245 : 0x57f287)
                .setAuthor({
                    name: `Mute ${roleAdded ? "Added" : "Removed"}`,
                    iconURL: guild.iconURL(),
                })
                .setTimestamp(createdTimestamp)
                .setThumbnail(newMember.displayAvatarURL())
                .setFooter({
                    text: `Member ID: ${newMember.id}`,
                    iconURL: guild.iconURL(),
                })
                .addFields(
                    {
                        name: "Member",
                        value: `${newMember.user}`,
                        inline: true,
                    },
                    { name: "By", value: `${executor}`, inline: true },
                    {
                        name: "Reason",
                        value: `\`${reason}\`` || "`No reason provided`",
                        inline: false,
                    },
                    {
                        name: "When",
                        value: `<t:${Math.floor(createdTimestamp / 1000)}:f>`,
                        inline: true,
                    }
                );

            // Send the embed to the log channel
            await muteChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error(
                "Error handling guildMemberUpdate for role changes:",
                error
            );
        }
    },
};
