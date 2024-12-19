const mongoose = require('mongoose');

const logChannelSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    punishment_channelId: { type: String },
    vacation_channelId: { type: String },
    mute_channelId: { type: String },
    timeout_channelId: { type: String},
    warn_channelId: { type: String },
    points_channelId: { type: String },
});

module.exports = mongoose.model('LogChannel', logChannelSchema);
