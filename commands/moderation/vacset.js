const {
    ButtonStyle,
    ButtonBuilder,
    ActionRowBuilder,
    EmbedBuilder,
} = require("discord.js");
const config = require("../../config.js");

module.exports = {
    name: "vacset",
    category: "moderation",
    slashCmdData: {
        name: "vacset",
        description: "Manage vacation status for users.",
    },
    devOnly: false,
    cooldown: "5s",
    async execute(client, interaction) {
        if (!config.developers.includes(interaction.user.id)) {
            return interaction.editReply(
                "> :x: You do not have permission to use this command."
            );
        }

        let embed = new EmbedBuilder()
            .setColor("#bf492d")
            .setImage(
                "https://media.discordapp.net/attachments/829124514629681172/1320202573554389053/RedFox_Community_Staff_Submitting_a_vacation.png?ex=6768bdf5&is=67676c75&hm=6085b3d44ae0dcce33033a08a3f57dd8adeb993226b86b83af398e8c2c6205ac&=&format=webp&quality=lossless&width=412&height=225"
            )
            .setThumbnail(interaction.guild.iconURL())
            .setAuthor({
                name: `Applying for vacation`,
                iconURL: interaction.guild.iconURL(),
            })
            .addFields(
                {
                    name: "> Duration",
                    value: `Duration must be 2 to 30 days`,
                },
                {
                    name: "> Reason",
                    value: "Please provide a reasonable reason",
                }
            )
            .setFooter({
                text: `Requesting a vacation`,
                iconURL: client.user.displayAvatarURL(),
            });

        let row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Apply")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("vacset_apply")
        );

        await interaction.editReply({
            content: "Successfully sent",
            ephemeral: true,
        });
        await interaction.channel.send({ embeds: [embed], components: [row] });
    },
};
