const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const Mutes = require('../../models/Mutes');
const LogChannel = require('../../models/LogChannel');

const muterole = "673133697108672532";
const rolesMute = [
    "1270780308341657660", "378659419652751363", "1169283299013820526",
    "1270779676729806919", "1068501587846246450", "1169639127789092895",
    "1270779316246155316", "855055867775025152", "1169640736262717471",
    "1270778782822957057", "327989761677590530", "1169002700281757751"
];

module.exports = {
    name: "mute",
    category: "moderation",
    slashCmdData: {
        name: "mute",
        description: "Mute someone for a specific duration",
        options: [
            {
                name: "member",
                description: "The member you want to mute",
                type: 6,
                required: true
            },
            {
                name: "duration",
                description: "Specify the duration of the mute (1 to 24 hours)",
                type: 4,
                required: true
            },
            {
                name: "reason",
                description: "Provide a reason for the mute",
                type: 3,
                required: true
            }
        ]
    },
    devOnly: false,
    usrPerms: [PermissionsBitField.Flags.MuteMembers],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        const member = interaction.options.getMember("member");
        const duration = interaction.options.getInteger("duration");
        const reason = interaction.options.getString("reason");

        if (duration < 1 || duration > 24) {
            return interaction.editReply("> :x: Please provide a valid duration from 1 to 24 hours!");
        }

        if (member.id === interaction.user.id) {
            return interaction.editReply("> :x: You cannot mute yourself!");
        } else if (member.id === client.user.id) {
            return interaction.editReply("> :x: I cannot mute myself!");
        } else if (!member) {
            return interaction.editReply("> :x: Member not found!");
        } else if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.editReply("> :x: You cannot mute a member with a higher role than you!");
        }

        if (member.roles.cache.has(muterole) && await Mutes.findOne({ userId: member.user.id })) {
            return interaction.editReply(`> :x: ${member.user} Is already muted!`);
        }

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.MuteMembers) &&
            !rolesMute.some(role => interaction.member.roles.cache.has(role))) {
            return interaction.editReply("> :x: You do not have permission to use this command!");
        }

        const logChannel = await LogChannel.findOne({});
        const mute_channel = logChannel ? interaction.guild.channels.cache.get(logChannel.mute_channelId) : null;

        const endTime = Date.now() + (duration * 60 * 60 * 1000);

        if (!member.roles.cache.has(muterole) && !await Mutes.findOne({ userId: member.user.id })) {
            await member.roles.add(muterole);
            await Mutes.create({
                userId: member.user.id,
                reason: reason,
                adminId: interaction.user.id,
                endTime: endTime,
                muteRole: true
            });

            await interaction.editReply(`> :white_check_mark: Successfully muted ${member.user} for \`${duration}\` hours! Reason: \`${reason}\``);

            if (mute_channel) {
                const embed = new EmbedBuilder()
                    .setColor("Red")
                    .setAuthor({ name: "Mute", iconURL: `${client.user.displayAvatarURL({ dynamic: true })}` })
                    .addFields(
                        { name: "Member", value: `${member.user}`, inline: true },
                        { name: "Admin", value: `${interaction.user}`, inline: true },
                        { name: "Reason", value: `\`${reason}\``, inline: true },
                        { name: "Duration", value: `\`${duration}\` hours`, inline: true },
                        { name: "End Time", value: `<t:${Math.floor(endTime / 1000)}:F>`, inline: true }
                    )
                    .setTimestamp()
                    .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }));

                mute_channel.send({ embeds: [embed] });
            }
        }
    },
    async loadMutes(client) {
        const expiredMutes = await Mutes.find();
        const now = Date.now();

        expiredMutes.forEach(async mute => {
            if(mute.endTime > now) {
                return;
            }
            if (mute.endTime <= now) {
                const guild = client.guilds.cache.get('300481238773399553');
                if (!guild) return;

                const member = await guild.members.fetch(mute.userId).catch(() => null);
                if (!member) return;

                
                if (member.roles.cache.has(muterole)) {
                    try {
                        await member.roles.remove(muterole);
                    } catch (error) {
                        console.error(`Failed to remove mute role from ${member.user.tag}:`, error);
                    }
                }

                try {
                    await Mutes.deleteOne({ userId: mute.userId });
                } catch (error) {
                    console.error(`Failed to delete mute record for ${member.user.tag}:`, error);
                }

                const logChannel = await LogChannel.findOne({}).catch(() => null);
                const mute_channel = logChannel ? guild.channels.cache.get(logChannel.mute_channelId) : null;

                if (mute_channel) {
                    const embed = new EmbedBuilder()
                        .setColor("Green")
                        .setAuthor({ name: "Unmute", iconURL: `${client.user.displayAvatarURL({ dynamic: true })}` })
                        .addFields(
                            { name: "Member", value: `<@${mute.userId}>`, inline: true },
                            { name: "Admin", value: `None`, inline: true },
                            { name: "Reason", value: `Mute Duration Expired`, inline: true }
                        )
                        .setTimestamp()
                        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 1024 }));

                    try {
                        mute_channel.send({ embeds: [embed] });
                    } catch (error) {
                        console.error(`Failed to send unmute log for ${member.user.tag}:`, error);
                    }
                }
            }
        });
    },
};