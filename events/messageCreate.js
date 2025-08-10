const { EmbedBuilder } = require("discord.js");
const UserMessageCount = require("../models/UserMessageCount");

const registerationChannel = "1322391034545700874";
const registerationLogChannel = "1322391839998738502";

module.exports = {
    event: "messageCreate",
    run: async (client, message) => {
        if (message.author.bot || !message.guild || !message.member) return;

        const { member, author, channel, content } = message;

        // --- Staff message tracking ---
        if (member.roles.cache.has(client.staffRole)) {
            let userData = await UserMessageCount.findOne({
                userId: author.id,
            });

            if (!userData) {
                userData = await UserMessageCount.create({
                    userId: author.id,
                    staffRole: true,
                    staffMessage: 0,
                    staffPoint: 0,
                    lastUpdated: Date.now(),
                });
            }

            userData.staffMessage += 1;
            userData.staffPoint += 1 / 2000;
            userData.lastUpdated = Date.now();
            await userData.save();
        }

        // --- Event message tracking ---
        if (
            channel.id === registerationChannel &&
            member.roles.cache.has(client.eventRole)
        ) {
            let userData = await UserMessageCount.findOne({
                userId: author.id,
            });

            if (!userData) {
                userData = await UserMessageCount.create({
                    userId: author.id,
                    eventRole: true,
                    eventPoint: 0,
                    lastUpdated: Date.now(),
                });
            }

            const pointKeywords = [
                {
                    keyword: "سويت",
                    value: 0.1668,
                    roles: ["1183154616465104997", "1063072755802714112"],
                },
                { keyword: "ساعدت", value: 0.1336 },
                { keyword: "تبرعت", value: 0.0668 },
            ];

            let awarded = [];

            for (const { keyword, value, roles } of pointKeywords) {
                if (content.includes(keyword)) {
                    if (
                        roles &&
                        !roles.some((roleId) => member.roles.cache.has(roleId))
                    )
                        continue;

                    userData.eventPoint += value;
                    awarded.push({ keyword, value });
                }
            }

            if (awarded.length > 0) {
                userData.lastUpdated = Date.now();
                await userData.save();

                // --- Logging to registration log channel ---
                const logChannel = client.channels.cache.get(
                    registerationLogChannel
                );
                if (logChannel && logChannel.isTextBased()) {
                    const embed = new EmbedBuilder()
                        .setTitle("📋 Event Points Logged")
                        .setColor("White")
                        .addFields(
                            {
                                name: "User",
                                value: `${author} (${author.id})`,
                                inline: false,
                            },
                            {
                                name: "Keyword(s)",
                                value: awarded.map((a) => a.keyword).join(", "),
                                inline: true,
                            },
                            {
                                name: "Points Awarded",
                                value: awarded
                                    .map((a) => a.value.toFixed(4))
                                    .join(", "),
                                inline: true,
                            },
                            {
                                name: "Total",
                                value: awarded
                                    .reduce((sum, a) => sum + a.value, 0)
                                    .toFixed(4),
                                inline: true,
                            },
                            {
                                name: "Updated At",
                                value: `<t:${Math.floor(
                                    userData.lastUpdated / 1000
                                )}:f>`,
                                inline: false,
                            }
                        )
                        .setFooter({ text: "Registration Activity Tracker" });

                    logChannel.send({ embeds: [embed] }).catch(console.error);
                }
            }
        }
    },
};
