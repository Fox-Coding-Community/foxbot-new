const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const userMessageCount = require("../../models/UserMessageCount");

const girlRole = "1297644742330417233";
const verifiedGirl = "1169249373234933900";
const points = 0.5;

module.exports = {
    name: "giverole",
    category: "moderation",
    slashCmdData: {
        name: "giverole",
        description: "Verify a girl and receive points",
        options: [
            {
                name: "member",
                description: "The member to verify",
                type: 6,
                required: true,
            },
        ],
    },
    devOnly: false,
    usrPerms: [],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        const member = interaction.options.getMember("member");

        if (
            !interaction.member.roles.cache.has(client.staffRole) &&
            !interaction.member.roles.cache.has(verifiedGirl)
        ) {
            return interaction.editReply(
                "> :x: You must have the girl role and be a staff member to use this command!"
            );
        }

        if (member.roles.cache.has(verifiedGirl)) {
            return interaction.editReply(
                "> :x: This member is already verified!"
            );
        }

        if (!member.roles.cache.has(girlRole)) {
            return interaction.editReply(
                "> :x: This member does not have the girl role!"
            );
        }

        await member.roles.add(verifiedGirl);
        await member.roles.remove(girlRole);

        let userData = await userMessageCount.findOne({
            userId: interaction.user.id,
        });

        if (!userData) {
            userData = new userMessageCount({
                userId: interaction.user.id,
                staffPoint: points,
            });
        }

        userData.staffPoint += points;
        await userData.save();

        return interaction.editReply(
            `> :white_check_mark: Successfully verified ${member}!`
        );
    },
};
