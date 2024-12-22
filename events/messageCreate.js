const UserMessageCount = require("../models/UserMessageCount");

const staffChats = [
    "709547829026095195",
    "701143969681375354",
    "378644933587894282",
    "1316063307232182353",
    "1233883853207244871",
    "678329543135592458",
    "1097140153581043813",
    "1260185769985708144",
    "362730500088922132",
    "358595350476357632",
    "1106627748904058930",
    "1050116464801239153",
    "1234825002680057866",
    "300481238773399553",
];

const eventChats = [
    "943403242887454720",
    "1254894014226759840",
    "943265102340169789",
    "709547829026095195",
];

module.exports = {
    event: "messageCreate",
    run: async (client, message) => {
        if (message.author.bot) return;

        const member = message.member;

        // Check for both staffRole and eventRole first
        if (
            member.roles.cache.some((role) => role.id === client.staffRole) &&
            member.roles.cache.some((role) => role.id === client.eventRole)
        ) {
            if (
                staffChats.includes(message.channel.id) ||
                eventChats.includes(message.channel.id)
            ) {
                let userData = await UserMessageCount.findOne({
                    userId: message.author.id,
                });

                if (!userData) {
                    userData = new UserMessageCount({
                        userId: message.author.id,
                        staffRole: true,
                        eventRole: true,
                        staffMessage: 0,
                        eventMessage: 0,
                        staffPoint: 0,
                        eventPoint: 0,
                        lastUpdated: Date.now(),
                    });
                }

                if (staffChats.includes(message.channel.id)) {
                    userData.staffMessage++;
                    userData.staffPoint += 1 / 3000;
                }

                if (eventChats.includes(message.channel.id)) {
                    userData.eventMessage++;
                    userData.eventPoint += 1 / 3000;
                }

                userData.lastUpdated = Date.now();
                await userData.save();
            }
        } else if (
            member.roles.cache.some((role) => role.id === client.staffRole)
        ) {
            // Staff role only
            if (staffChats.includes(message.channel.id)) {
                let userData = await UserMessageCount.findOne({
                    userId: message.author.id,
                });

                if (!userData) {
                    userData = new UserMessageCount({
                        userId: message.author.id,
                        staffRole: true,
                        staffMessage: 0,
                        staffPoint: 0,
                        lastUpdated: Date.now(),
                    });
                }

                userData.staffMessage++;
                userData.staffPoint += 1 / 3000;
                userData.lastUpdated = Date.now();
                await userData.save();
            }
        } else if (
            member.roles.cache.some((role) => role.id === client.eventRole)
        ) {
            // Event role only
            if (eventChats.includes(message.channel.id)) {
                let userData = await UserMessageCount.findOne({
                    userId: message.author.id,
                });

                if (!userData) {
                    userData = new UserMessageCount({
                        userId: message.author.id,
                        eventRole: true,
                        eventMessage: 0,
                        eventPoint: 0,
                        lastUpdated: Date.now(),
                    });
                }

                userData.eventMessage++;
                userData.eventPoint += 1 / 3000;
                userData.lastUpdated = Date.now();
                await userData.save();
            }
        }
    },
};