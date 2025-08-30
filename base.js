require("dotenv").config();
const {
    Client,
    Collection,
    GatewayIntentBits,
    Options,
    PermissionsBitField,
    PresenceUpdateStatus,
    Partials,
} = require("discord.js");

const client = new Client({
    intents: Object.values(GatewayIntentBits),
    partials: Object.values(Partials),
    allowedMentions: { repliedUser: false },
    fetchAllMembers: true,
});

const { loadPunishments } = require("./commands/moderation/punishment");
const { loadVacations } = require("./events/ButtonsAndModal.js");
const { loadMutes } = require("./commands/moderation/mute");

client.commands = new Collection();
client.config = require("./config");
client.color = "White";
client.staffRole = "1165209477302198282";
client.eventRole = "1213113479599493120";
client.highStaffRole = "1197467231962025984";
client.staffRoles = [
    1165209477302198282, 1270778782822957057, 855055867775025152,
    1169640736262717471, 1270779316246155316, 327989761677590530,
    1169002700281757751, 1270779676729806919, 1068501587846246450,
    1169639127789092895, 1270780308341657660, 378659419652751363,
    1169283299013820526, 451665764936712192, 1197467231962025984,
    460539606971187200, 1213597128841232395, 1183154616465104997,
    1063072755802714112, 1213113479599493120, 1119120674087239732,
    1262705542972047370, 1380170344211550238,
];
client.punishmentRole = "1070078397453189161";
client.cooldowns = new Collection();

["command", "events"].forEach((handler) => {
    require(`./handlers/${handler}`)(client);
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isModalSubmit()) {
        await require("./commands/moderation/info").onModalSubmit(
            client,
            interaction
        );
    }
});

client.once("ready", async () => {
    await loadPunishments(client);
    await loadVacations(client);
    await loadMutes(client);
    setInterval(() => loadPunishments(client), 60000);
    setInterval(async () => await loadVacations(client), 60000);
    setInterval(() => loadMutes(client), 60000);

    client.user.setPresence({
        activities: [
            {
                name: "a fox! - /help",
                type: 3,
                url: "https://www.twitch.tv/redfox",
            },
        ],
        status: "idle",
    });

    client.user.setActivity({
        name: "a fox! - /help",
        type: 3,
        url: "https://www.twitch.tv/redfox",
    });
});

// Handle Error
process.on("uncaughtException", function (error) {
    console.error(error);
});

process.on("unhandledRejection", function (error) {
    console.error(error);
});

process.on("rejectionHandled", function (error) {
    console.error(error);
});

client.login(process.env.TOKEN);
