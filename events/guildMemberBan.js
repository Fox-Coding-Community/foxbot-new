const { Events } = require("discord.js");

module.exports = {
    event: "guildBanAdd",
    run: async (client, ban) => {
        // `ban` is a GuildBan object, not a member
        const user = await client.users.fetch(ban.user.id);

        return await user
            .send(
                `> **تم تبنيدك من سيرفر ريدفوكس,
            
            يمكنك فتح تيكيت في سيرفر الباندات:
            
            https://discord.gg/NrDvWSpFx6
             **`
            )
            .then(() => console.log("sent "))
            .catch((err) => {
                return console.log(err);
            });
    },
};
