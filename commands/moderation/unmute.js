const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Mutes = require("../../models/Mutes");
const LogChannel = require("../../models/LogChannel");

const muterole = "673133697108672532";
const rolesMute = [
    "1270780308341657660",
    "378659419652751363",
    "1169283299013820526",
    "1270779676729806919",
    "1068501587846246450",
    "1169639127789092895",
    "1270779316246155316",
    "855055867775025152",
    "1169640736262717471",
    "1270778782822957057",
    "327989761677590530",
    "1169002700281757751",
];

module.exports = {
    name: "unmute",
    category: "moderation",
    slashCmdData: {
        name: "unmute",
        description: "Unmute someone if they're muted",
        options: [
            {
                name: "member",
                description: "The member you want to unmute",
                type: 6,
                required: true,
            },
            {
                name: "reason",
                description: "Provide a reason for the unmute",
                type: 3,
                required: false,
            },
        ],
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.MuteMembers],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        const member = interaction.options.getMember("member");
        const reason = interaction.options.getString("reason") || "None";

        // Basic checks
        if (!member || !interaction.guild) {
            return interaction.editReply(
                "> :x: Unable to find the specified guild or member!"
            );
        }

        if (member.id === interaction.user.id) {
            return interaction.editReply("> :x: You cannot unmute yourself!");
        } else if (member.id === client.user.id) {
            return interaction.editReply("> :x: I cannot unmute myself!");
        } else if (!member) {
            return interaction.editReply("> :x: Invalid member!");
        } else if (
            member.roles.highest.position >=
            interaction.member.roles.highest.position
        ) {
            return interaction.editReply(
                "> :x: You cannot unmute a member with a higher role than you!"
            );
        }

        if (
            !interaction.member.permissions.has(
                PermissionsBitField.Flags.MuteMembers
            ) &&
            !rolesMute.some((role) => interaction.member.roles.cache.has(role))
        ) {
            return interaction.editReply(
                "> :x: You do not have permission to use this command!"
            );
        }

        if (!member.roles.cache.has(muterole)) {
            return interaction.editReply(`> :x: ${member.user} is not muted!`);
        }

        await member.roles.remove(muterole);
        await Mutes.deleteOne({ userId: member.user.id });

        await interaction.editReply(
            `> :white_check_mark: Successfully unmuted ${member.user}!`
        );

        const logChannel = await LogChannel.findOne({
            guildId: interaction.guild.id,
        });
        const mute_channel = logChannel
            ? interaction.guild.channels.cache.get(logChannel.mute_channelId)
            : null;

        if (mute_channel) {
            const embed = new EmbedBuilder()
                .setColor("Green")
                .setAuthor({
                    name: "Unmute",
                    iconURL: `${client.user.displayAvatarURL({
                        dynamic: true,
                    })}`,
                })
                .addFields(
                    { name: "Member", value: `${member.user}`, inline: true },
                    {
                        name: "Admin",
                        value: `${interaction.user}`,
                        inline: true,
                    },
                    { name: "Reason", value: `\`${reason}\``, inline: true }
                )
                .setTimestamp()
                .setThumbnail(
                    member.user.displayAvatarURL({ dynamic: true, size: 1024 })
                );

            mute_channel.send({ embeds: [embed] });
        }
    },
};
