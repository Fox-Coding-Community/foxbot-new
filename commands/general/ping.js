const { EmbedBuilder, ButtonBuilder, ButtonStyle , ActionRowBuilder } = require("discord.js")
const utils = require("node-os-utils")

module.exports = {
    name: "ping",
    category: "general",
    slashCmdData :{
    name: "ping",
    description: "Displays bot's Host/API info/ping",
    },
    devOnly: false,
    usrPerms: [],
    botPerms: [],
    cooldown: "10s",
    async execute(client, interaction) {
        let ping = Date.now() - interaction.createdTimestamp;
        function msToTime(duration) {
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

        let embed = new EmbedBuilder()
        .setAuthor({name: "Pong!", iconURL: `${client.user.displayAvatarURL({ dynamic: true })}`})
        .addFields({
            name: `> | Host info:`,
            value: `Host: ${utils.os.platform()} | ${await utils.os.oos()}
            CPU: ${await utils.cpu.usage()}%`,
            inline: true
        }, {
            name: `>  | API info:`, value: `Discord API: ${client.ws.ping}MS
             Time Taken: ${ping}MS
              Uptime: ${msToTime(client.uptime)}`,
    })
            .setColor(client.color)
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, format: "png", size: 1024 }) })
    
            await interaction.editReply({embeds : [embed]})
}
}